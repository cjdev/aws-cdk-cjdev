import {Construct} from "@aws-cdk/core";
import {Effect, ManagedPolicy, PolicyStatement} from "@aws-cdk/aws-iam";

const createRunTaskPolicy = (scope: Construct, name: string, resources: string[]) =>
    createAllowPolicy(scope, `Run${name}`, ['ecs:RunTask'],resources);

const createInvokeLambdaPolicy = (scope: Construct, name: string, resources: string[]) =>
    createAllowPolicy(scope, `Invoke${name}`, ['lambda:invokeFunction'],resources);

const createAllowPolicy = (scope: Construct, name: string, actions: string[], resources: string[]) => new ManagedPolicy(
    scope,
    `${name}Policy`, {
        statements: [
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: actions,
                resources: resources
            })
        ]
    }
);

export {
    createInvokeLambdaPolicy,
    createRunTaskPolicy,
    createAllowPolicy
}