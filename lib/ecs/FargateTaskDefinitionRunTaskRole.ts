import {Effect, ManagedPolicy, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {FargateTaskDefinition} from "@aws-cdk/aws-ecs";
import {ManagedPolicyOverPolicyStatements} from "../iam/ManagedPolicyOverPolicyStatements";
import {Construct} from "@aws-cdk/core";

export class FargateTaskDefinitionRunTaskRole extends Role {
    constructor(scope: Construct, id: string, task: FargateTaskDefinition) {
        super(scope, id, {
                assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
                managedPolicies: [
                    new ManagedPolicyOverPolicyStatements(scope, 'RunTaskPolicy',
                        [{
                            actions: ['ecs:RunTask'],
                            resources: [task.taskDefinitionArn],
                            effect: Effect.ALLOW
                        }]),
                    new ManagedPolicyOverPolicyStatements(scope, 'PassRolePolicy',
                        [{
                            effect: Effect.ALLOW,
                            actions: ['iam:PassRole'],
                            resources: [task.taskRole.roleArn, task.executionRole!.roleArn]
                        }]),
                    ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
                ]
            }
        );
    }
}