import * as cdk from '@aws-cdk/core';
import * as logs from '@aws-cdk/aws-logs';
import * as logDestinations from '@aws-cdk/aws-logs-destinations';
import * as kinesis from '@aws-cdk/aws-kinesis';
import * as kinesisFirehose from '@aws-cdk/aws-kinesisfirehose';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';

/*
 * CloudwatchS3Connector
 * Subscribes to a given Cloudwatch Log Group
 * and streams logs to a given S3 Bucket
 * */

interface CloudwatchS3ConnectorProps {
    /*
     * Source Cloudwatch Log Group
     * */
    logGroup: logs.ILogGroup

    /*
     * Destination S3 Bucket
     * */
    bucket: s3.IBucket

    /*
     * For format, see `https://docs.aws.amazon.com/firehose/latest/dev/s3-prefixes.html`
     * @default "logs/logDate=!{timestamp:yyyy-MM-dd}/"
     * */
    destinationPathPrefix?: string

    /*
     * For format, see `https://docs.aws.amazon.com/firehose/latest/dev/s3-prefixes.html`
     * @default "errorOutput/errorOutputType=!{firehose:error-output-type}/logDate=!{timestamp:yyyy-MM-dd}/"
     * */
    destinationErrorPathPrefix?: string
}

export class CloudwatchS3Connector {
    constructor(scope: cdk.Construct, id: string, props: CloudwatchS3ConnectorProps) {
        const {bucket, logGroup} = props;
        const destinationPathPrefix = props.destinationPathPrefix || "logs/logDate=!{timestamp:yyyy-MM-dd}/";
        const destinationErrorPathPrefix = props.destinationErrorPathPrefix || "errorOutput/errorOutputType=!{firehose:error-output-type}/logDate=!{timestamp:yyyy-MM-dd}/";

        const bucketRole = new iam.Role(scope, `${id}BucketWriteRole`, {
            assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com")
        });
        bucket.grantWrite(bucketRole);

        const kinesisStream = new kinesis.Stream(scope, `${id}KinesisLogStream`, {
            streamName: `${id}KinesisLogStream`
        });

        const kinesisStreamPolicyStatement = new iam.PolicyStatement({
            resources: [kinesisStream.streamArn],
            effect: iam.Effect.ALLOW,
            actions: [
                "kinesis:DescribeStream",
                "kinesis:GetRecords",
                "kinesis:GetShardIterator"
            ]
        });
        const kinesisStreamPolicy = new iam.PolicyDocument({
            statements: [kinesisStreamPolicyStatement]
        });
        const kinesisStreamRole = new iam.Role(scope, `${id}KinesisStreamAccessRole`, {
            assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com"),
            inlinePolicies: {
                kinesisStreamPolicy: kinesisStreamPolicy
            }
        });

        const kinesisSubscriptionDestination = new logDestinations.KinesisDestination(kinesisStream);
        new logs.SubscriptionFilter(scope, `${id}ContainerLogGroupSubscription`, {
            logGroup: logGroup,
            destination: kinesisSubscriptionDestination,
            filterPattern: logs.FilterPattern.allEvents()
        });

        new kinesisFirehose.CfnDeliveryStream(scope, `${id}KinesisFirehose`, {
            deliveryStreamType: "KinesisStreamAsSource",
            extendedS3DestinationConfiguration: {
                prefix: destinationPathPrefix,
                errorOutputPrefix: destinationErrorPathPrefix,
                bucketArn: bucket.bucketArn,
                bufferingHints: {
                    intervalInSeconds: 60,
                    sizeInMBs: 1
                },
                compressionFormat: "GZIP",
                roleArn: bucketRole.roleArn,
            },
            kinesisStreamSourceConfiguration: {
                kinesisStreamArn: kinesisStream.streamArn,
                roleArn: kinesisStreamRole.roleArn,
            }
        });
    }
}
