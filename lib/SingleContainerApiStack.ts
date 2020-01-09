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

class SingleContainerApiStack extends Stack {
    constructor(scope: Construct,
                id: string,
                props: SingleContainerApiStackProps) {
        super(scope, id);

        const repo = new SingleImageRepository(this,'SingleImageRepository');
        const repoUploadImageRole = new RepoUploaderRole(this, 'RepoUploaderRole', repo, props.repoUploadImageRoleAssumedByPrincipal);

        const cluster = new Cluster(this, 'Cluster');
        const task = new FargateContainerTaskDefinition(this, 'ContainerTask', repo.Image, props.containerEnvVars, props.taskProps);
        const taskRunRole = new FargateTaskDefinitionRunTaskRole(this, 'RunTaskRole', task);
        const taskRunner = new Function(this, 'RunTaskLambda', {
            role: taskRunRole,
            environment: {
                taskDefinitionArn: task.taskDefinitionArn,
                clusterArn: cluster.clusterArn,
                subnets: Fn.importValue('network-AttachedNetworkLeftSubnet') + ',' + Fn.importValue('network-AttachedNetworkRightSubnet'),
                securityGroups:  Fn.importValue('network-AttachedNetworkDefaultSecurityGroup')
            },
            ...props.taskRunnerFunctionProps
        });


        const api = new RestApiProxyWithCustomAuthorizer(this,'RestApi',taskRunner, props.apiAuthorizerFunctionProps);

        new CfnOutput(this, 'SingleImageRepositoryUri', {value: repo.repositoryUri});
        new CfnOutput(this, 'RepoUploaderRoleArn', {value: repoUploadImageRole.roleArn});
        new CfnOutput(this, 'ContainerTaskDefinitionArn', {value: task.taskDefinitionArn});
    }
}

export {
    SingleContainerApiStack,
    SingleContainerApiStackProps
}