import * as cdk from '@aws-cdk/core';
import * as logs from '@aws-cdk/aws-logs';
import * as logDestinations from '@aws-cdk/aws-logs-destinations';
import * as kinesis from '@aws-cdk/aws-kinesis';
import * as s3 from '@aws-cdk/aws-s3';
import {KinesisS3DeliveryStream} from "../kinesis";

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

/*
 * CloudwatchS3Connector
 * Subscribes to a given Cloudwatch Log Group
 * and streams logs to a given S3 Bucket
 * */
export class CloudwatchS3Connector {
    constructor(scope: cdk.Construct, id: string, props: CloudwatchS3ConnectorProps) {
        const {bucket, logGroup, destinationPathPrefix, destinationErrorPathPrefix} = props;

        const kinesisStream = new kinesis.Stream(scope, `${id}KinesisLogStream`, {
            streamName: `${id}KinesisLogStream`
        });

        const kinesisSubscriptionDestination = new logDestinations.KinesisDestination(kinesisStream);
        new logs.SubscriptionFilter(scope, `${id}ContainerLogGroupSubscription`, {
            logGroup: logGroup,
            destination: kinesisSubscriptionDestination,
            filterPattern: logs.FilterPattern.allEvents()
        });

        new KinesisS3DeliveryStream(scope, id, {
            kinesisStream,
            bucket,
            destinationPathPrefix,
            destinationErrorPathPrefix
        });
    }
}
