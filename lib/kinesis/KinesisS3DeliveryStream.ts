import * as cdk from '@aws-cdk/core';
import * as kinesis from '@aws-cdk/aws-kinesis';
import * as kinesisFirehose from '@aws-cdk/aws-kinesisfirehose';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';

interface KinesisS3DeliveryStreamProps {
    /*
     * Source Kinesis stream
     * */
    kinesisStream: kinesis.IStream

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

/*
 * KinesisS3DeliveryStream
 * Delivery stream for Kinesis to given S3 bucket
 * */
export class KinesisS3DeliveryStream {
    constructor(scope: cdk.Construct, id: string, props: KinesisS3DeliveryStreamProps) {
        const {bucket, kinesisStream} = props;
        const destinationPathPrefix = props.destinationPathPrefix || "logs/logDate=!{timestamp:yyyy-MM-dd}/";
        const destinationErrorPathPrefix = props.destinationErrorPathPrefix || "errorOutput/errorOutputType=!{firehose:error-output-type}/logDate=!{timestamp:yyyy-MM-dd}/";

        const bucketRole = new iam.Role(scope, `${id}BucketWriteRole`, {
            assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com")
        });
        bucket.grantWrite(bucketRole);

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
