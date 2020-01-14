import {CfnOutput, Construct, Fn} from "@aws-cdk/core";
import {FargateTaskDefinitionProps, Cluster} from "@aws-cdk/aws-ecs";
import {IPrincipal} from "@aws-cdk/aws-iam";
import {Function, FunctionProps} from '@aws-cdk/aws-lambda';

import {ContainerTaskExecutionRole, RepoUploaderRole, RunFargateTaskRole} from './iam'
import {FargateContainerTaskDefinition} from "./ecs";
import {SingleImageRepository} from "./ecr";
import {RestApiProxyWithCustomAuthorizer} from "./apigateway";
import {createNamedSpacedSecretHashMap} from "./secretsmanager";

interface SingleContainerApiStackProps {
    repoUploadImageRoleAssumedByPrincipal: IPrincipal,
    apiAuthorizerFunctionProps: FunctionProps,
    taskRunnerFunctionProps: FunctionProps,
    containerEnvVars: string[],
    taskProps: FargateTaskDefinitionProps,
    cluster?: Cluster
}

/**
 * Stack with all the components and wiring required to run a single container.
 * Note: taskRunnerFunctionProps will have its role and environment properties overwritten for proper wiring
 */
class SingleContainerApi extends Construct {
    public readonly Repository: SingleImageRepository;
    public readonly Task: FargateContainerTaskDefinition;
    public readonly TaskRunnerLambda: Function;
    public readonly Api: RestApiProxyWithCustomAuthorizer;

    constructor(scope: Construct,
                id: string,
                props: SingleContainerApiStackProps) {
        super(scope, id);

        const imageRepository = new SingleImageRepository(this,'SingleImageRepository');
        const imageRepositoryUploadRole = new RepoUploaderRole(this, 'RepoUploaderRole', imageRepository, props.repoUploadImageRoleAssumedByPrincipal);

        const envVarSecretHashMap = createNamedSpacedSecretHashMap(scope, id, props.containerEnvVars);
        const envVarSecretArns = Object.values(envVarSecretHashMap).map(v => v.secretArn);
        const taskProps = (props.taskProps.executionRole)
            ? props.taskProps
            : {
                ...props.taskProps,
                executionRole: new ContainerTaskExecutionRole(this, 'ContainerTaskExecutionRole', imageRepository, envVarSecretArns)
        };
        const task = new FargateContainerTaskDefinition(this, 'ContainerTask', imageRepository.Image, taskProps, envVarSecretHashMap);

        const cluster = props.cluster || new Cluster(this, 'Cluster');
        const taskRunner = new Function(this, 'RunTaskLambda', {
            ...props.taskRunnerFunctionProps,
            role: new RunFargateTaskRole(this, 'RunTaskRole', task),
            environment: {
                taskDefinitionArn: task.taskDefinitionArn,
                clusterArn: cluster.clusterArn,
                subnets: Fn.importValue('network-AttachedNetworkLeftSubnet') + ',' + Fn.importValue('network-AttachedNetworkRightSubnet'),
                securityGroups:  Fn.importValue('network-AttachedNetworkDefaultSecurityGroup')
            }
        });

        new RestApiProxyWithCustomAuthorizer(this,'RestApi',taskRunner, props.apiAuthorizerFunctionProps);

        new CfnOutput(this, 'ImageRepositoryUri', {value: imageRepository.repositoryUri});
        new CfnOutput(this, 'ImageRepositoryUploadRoleArn', {value: imageRepositoryUploadRole.roleArn});
        new CfnOutput(this, 'ContainerTaskDefinitionArn', {value: task.taskDefinitionArn});
    }
}

export {
    SingleContainerApi,
    SingleContainerApiStackProps
}