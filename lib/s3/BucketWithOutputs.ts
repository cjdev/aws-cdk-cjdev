import {Bucket, BucketProps} from "@aws-cdk/aws-s3";
import {CfnOutput, Construct} from "@aws-cdk/core";

export class BucketWithOutputs extends Bucket {
    constructor(scope: Construct, id: string, props?: BucketProps) {
        super(scope, id, props);

        new CfnOutput(scope, `${id}Arn`, { value: this.bucketArn });
        new CfnOutput(scope, `${id}Name`, { value: this.bucketName });
    }
}