import {Effect, ManagedPolicy, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {FargateTaskDefinition} from "@aws-cdk/aws-ecs";
import {ManagedPolicyOverPolicyStatements} from "../iam/ManagedPolicyOverPolicyStatements";

export class FargateTaskDefinitionRunTaskRole extends Role {
    constructor(scope: FargateTaskDefinition) {
        super(scope, 'RunTaskRole', {
                assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
                managedPolicies: [
                    new ManagedPolicyOverPolicyStatements(scope, 'RunTaskPolicy',
                        [{
                            actions: ['ecs:RunTask'],
                            resources: [scope.taskDefinitionArn],
                            effect: Effect.ALLOW
                        }]),
                    new ManagedPolicyOverPolicyStatements(scope, 'PassRolePolicy',
                        [{
                            effect: Effect.ALLOW,
                            actions: ['iam:PassRole'],
                            resources: [scope.taskRole.roleArn, scope.executionRole!.roleArn]
                        }]),
                    ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
                ]
            }
        );
    }
}