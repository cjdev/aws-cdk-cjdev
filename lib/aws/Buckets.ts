import {Bucket} from "@aws-cdk/aws-s3";
import {CfnOutput, Construct} from "@aws-cdk/core";

const createBucket = (scope: Construct, name: string) => {
    const bucket = new Bucket(scope, `${name}Bucket`);
    new CfnOutput(scope, `${name}BucketArn`, { value: bucket.bucketArn });
    new CfnOutput(scope, `${name}BucketName`, { value: bucket.bucketName });
    return bucket;
};

export{
    createBucket
};