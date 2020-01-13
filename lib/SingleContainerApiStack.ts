import {CfnOutput, Construct, Fn, Stack} from "@aws-cdk/core";
import {FargateTaskDefinitionProps, Cluster} from "@aws-cdk/aws-ecs";
import {IPrincipal} from "@aws-cdk/aws-iam";
import {Function, FunctionProps} from '@aws-cdk/aws-lambda';

import {RepoUploaderRole, RunFargateTaskRole} from './iam'
import {FargateContainerTaskDefinition} from "./ecs";
import {SingleImageRepository} from "./ecr";
import {RestApiProxyWithCustomAuthorizer} from "./apigateway";

interface SingleContainerApiStackProps {
    repoUploadImageRoleAssumedByPrincipal: IPrincipal,
    apiAuthorizerFunctionProps: FunctionProps,
    taskRunnerFunctionProps: FunctionProps,
    containerEnvVars?: Array<string>,
    taskProps?: FargateTaskDefinitionProps
}

/*
    TODO: look into helping the wiring of the task executrion and task role, currently passed in with the taskProps

    Task.ExecutionRole should have statements:
        "DownloadImageFromRuntimeRepository"
            Effect: Allow
                Action:
                    - ecr:GetAuthorizationToken
                Resource: "*"
            Effect: Allow
                Action:
                    - ecr:BatchCheckLayerAvailability
                    - ecr:GetDownloadUrlForLayer
                    - ecr:BatchGetImage
                Resource: <RepositoryArn>

        "GetSecretFromSecretsManager"
            Effect: Allow
                Action:
                    - secretsmanager:GetSecretValue
                Resource:
                    - <List of Secret Names>

        "CreateLogs"
            Effect: Allow
                Action:
                    - logs:CreateLogGroup
                    - logs:CreateLogStream
                    - logs:PutLogEvents
                Resource: arn:aws:logs:*:*:*

    with an AssumeRolePolicyDocument statement of:
            Effect: Allow
                Action: sts:AssumeRole
                Principal:
                    Service:
                        - ecs.amazonaws.com
                        - ecs-tasks.amazonaws.com


    Task.TaskRole should be defined by stack creator, may need to expose both managed policies and policy documents so consumer can
    use built in AWS managed polices.      with an AssumeRolePolicyDocument statement
                Effect: Allow
                Action: sts:AssumeRole
                Principal:
                    Service:
                        - ecs-tasks.amazonaws.com


 */

/**
 * Stack with all the components and wiring required to run a single container.
 * Note: taskRunnerFunctionProps will have its role and environment properties overwritten for proper wiring
 */
class SingleContainerApiStack extends Stack {
    constructor(scope: Construct,
                id: string,
                props: SingleContainerApiStackProps) {
        super(scope, id);

        const imageRepository = new SingleImageRepository(this,'SingleImageRepository');
        const imageRepositoryUploadRole = new RepoUploaderRole(this, 'RepoUploaderRole', imageRepository, props.repoUploadImageRoleAssumedByPrincipal);

        const cluster = new Cluster(this, 'Cluster');
        const overridenTaskProps = {
            ...props.taskProps
        };
        const task = new FargateContainerTaskDefinition(this, 'ContainerTask', imageRepository.Image, props.containerEnvVars, overridenTaskProps);
        const overriddenTaskRunnerFunctionProps = {
            ...props.taskRunnerFunctionProps,
            role: new RunFargateTaskRole(this, 'RunTaskRole', task),
            environment: {
                taskDefinitionArn: task.taskDefinitionArn,
                clusterArn: cluster.clusterArn,
                subnets: Fn.importValue('network-AttachedNetworkLeftSubnet') + ',' + Fn.importValue('network-AttachedNetworkRightSubnet'),
                securityGroups:  Fn.importValue('network-AttachedNetworkDefaultSecurityGroup')
            }
        };
        const taskRunner = new Function(this, 'RunTaskLambda', overriddenTaskRunnerFunctionProps);
        new RestApiProxyWithCustomAuthorizer(this,'RestApi',taskRunner, props.apiAuthorizerFunctionProps);

        new CfnOutput(this, 'ImageRepositoryUri', {value: imageRepository.repositoryUri});
        new CfnOutput(this, 'ImageRepositoryUploadRoleArn', {value: imageRepositoryUploadRole.roleArn});
        new CfnOutput(this, 'ContainerTaskDefinitionArn', {value: task.taskDefinitionArn});
    }
}

export {
    SingleContainerApiStack,
    SingleContainerApiStackProps
}