import {Effect, ManagedPolicy, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {FargateTaskDefinition} from "@aws-cdk/aws-ecs";
import {Construct} from "@aws-cdk/core";
import {PolicyDocumentOverPolicyStatements} from "../iam/PolicyDocumentOverPolicyStatements";

export class FargateTaskDefinitionRunTaskRole extends Role {
    constructor(scope: Construct, id: string, task: FargateTaskDefinition) {
        super(scope, id, {
                assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
                inlinePolicies: PolicyDocumentOverPolicyStatements.asRoleInlinePolicies([
                        {
                            actions: ['ecs:RunTask'],
                            resources: [task.taskDefinitionArn],
                            effect: Effect.ALLOW
                        },
                        {
                                effect: Effect.ALLOW,
                                actions: ['iam:PassRole'],
                                resources: [task.taskRole.roleArn, task.executionRole!.roleArn]
                        }
                        ]),
                managedPolicies: [
                    ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
                ]
            }
        );
    }
}