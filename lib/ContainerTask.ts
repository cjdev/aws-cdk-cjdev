import {CfnOutput, Construct} from "@aws-cdk/core";
import {ContainerImage, FargateTaskDefinition, FargateTaskDefinitionProps, LogDriver} from "@aws-cdk/aws-ecs";
import {createManagedPolicy, createNamespacedEcsSecrets, createLambdaPrinciple} from "./internal";
import {Effect, ManagedPolicy} from "@aws-cdk/aws-iam";
import {Function, FunctionProps, IFunction} from '@aws-cdk/aws-lambda';
import {RoleWithOutputs} from './RoleWithOutputs'

class FargateContainerTaskDefinition extends FargateTaskDefinition {
     constructor(scope: Construct,
                id: string,
                taskEnvironment: [string],
                image: ContainerImage,
                taskProps?: FargateTaskDefinitionProps) {
        super(scope, id, taskProps);

        this.addContainer(`${id}Container`, {
            image,
            secrets: createNamespacedEcsSecrets(scope, id, taskEnvironment),
            logging: LogDriver.awsLogs({
                streamPrefix: `${id}ContainerLog`
            })
        });
        new CfnOutput(this, 'TaskDefinitionArn', { value: this.taskDefinitionArn });
    }
}

class RunTaskRole extends RoleWithOutputs {
    constructor(scope: FargateContainerTaskDefinition) {
        super(scope, 'RunTaskRole', {
                assumedBy: createLambdaPrinciple(),
                managedPolicies: [
                    createManagedPolicy(scope, 'RunTaskPolicy',
                        [{
                            actions: ['ecs:RunTask'],
                            resources: [scope.taskDefinitionArn],
                            effect: Effect.ALLOW
                        }]),
                    createManagedPolicy(scope, 'PassRolePolicy',
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

export class ContainerTask extends Construct {
    public readonly TaskRunner: IFunction;
    constructor(scope: Construct,
                id: string,
                taskEnvironment: [string],
                image: ContainerImage,
                invokerFunctionProps: FunctionProps,
                taskProps?: FargateTaskDefinitionProps) {
        super(scope, id);

        const task = new FargateContainerTaskDefinition(this, 'ContainerTask', taskEnvironment, image, taskProps);
        const runTaskRole = new RunTaskRole(task);
        const runner = new Function(this, 'RunTaskLambda', {role: runTaskRole, ...invokerFunctionProps });

        new CfnOutput(this, 'RunTaskLambdaArn', { value: runner.functionArn });
        this.TaskRunner = runner;
    }
}