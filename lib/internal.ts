import {CfnOutput, Construct} from "@aws-cdk/core";
import {Effect, IManagedPolicy, ManagedPolicy, PolicyStatement, PrincipalBase, Role} from "@aws-cdk/aws-iam";
import {Bucket} from "@aws-cdk/aws-s3";

const createRole = (scope: Construct,
                    name: string,
                    principle: PrincipalBase,
                    managedPolicies: IManagedPolicy[]) => {
    const role = new Role(scope, name, {
        managedPolicies: managedPolicies,
        assumedBy: principle,
    });
    new CfnOutput(scope, `${role}Arn`, { value: role.roleArn });
    return role;
};


const createAllowPolicy = (scope: Construct, name: string, actions: string[], resources: string[]) =>
    new ManagedPolicy(
        scope,
        name, {
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: actions,
                    resources: resources
                })
            ]
        });

const createBucket = (scope: Construct, name: string) => {
    const bucket = new Bucket(scope, `${name}`);
    new CfnOutput(scope, `${name}Arn`, { value: bucket.bucketArn });
    new CfnOutput(scope, `${name}Name`, { value: bucket.bucketName });
    return bucket;
};

export {
    createAllowPolicy,
    createBucket,
    createRole
}