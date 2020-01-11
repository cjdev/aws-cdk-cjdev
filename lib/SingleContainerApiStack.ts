import {CfnOutput, Construct, Fn, Stack} from "@aws-cdk/core";
import {FargateTaskDefinitionProps, Cluster} from "@aws-cdk/aws-ecs";
import {IPrincipal} from "@aws-cdk/aws-iam";
import {Function, FunctionProps} from '@aws-cdk/aws-lambda';
import {FargateContainerTaskDefinition} from "./ecs/FargateContainerTaskDefinition";
import {FargateTaskDefinitionRunTaskRole} from "./ecs/FargateTaskDefinitionRunTaskRole";
import {SingleImageRepository} from "./ecr/SingleImageRepository";
import {RepoUploaderRole} from "./ecr/RepoUploaderRole";
import {RestApiProxyWithCustomAuthorizer} from "./apigateway/RestApiProxyWithCustomAuthorizer";

interface SingleContainerApiStackProps {
    repoUploadImageRoleAssumedByPrincipal: IPrincipal,
    apiAuthorizerFunctionProps: FunctionProps,
    taskRunnerFunctionProps: FunctionProps,
    containerEnvVars?: Array<string>,
    taskProps?: FargateTaskDefinitionProps
}

//TODO: look into helping the wiring of the task executrion and task role, currently passed in with the taskProps

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
        const task = new FargateContainerTaskDefinition(this, 'ContainerTask', imageRepository.Image, props.containerEnvVars, props.taskProps);
        const taskRunner = new Function(this, 'RunTaskLambda', {
            role: new FargateTaskDefinitionRunTaskRole(this, 'RunTaskRole', task),
            environment: {
                taskDefinitionArn: task.taskDefinitionArn,
                clusterArn: cluster.clusterArn,
                subnets: Fn.importValue('network-AttachedNetworkLeftSubnet') + ',' + Fn.importValue('network-AttachedNetworkRightSubnet'),
                securityGroups:  Fn.importValue('network-AttachedNetworkDefaultSecurityGroup')
            },
            ...props.taskRunnerFunctionProps
        });
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