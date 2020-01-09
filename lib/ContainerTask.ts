import {CfnOutput, Construct} from "@aws-cdk/core";
import {ContainerImage, FargateTaskDefinitionProps} from "@aws-cdk/aws-ecs";
import {Repository} from '@aws-cdk/aws-ecr';
import {IPrincipal} from "@aws-cdk/aws-iam";
import {Function, FunctionProps, IFunction} from '@aws-cdk/aws-lambda';
import {FargateContainerTaskDefinition} from "./ecs/FargateContainerTaskDefinition";
import {FargateTaskDefinitionRunTaskRole} from "./ecs/FargateTaskDefinitionRunTaskRole";
import {RepoUploaderRole} from "./ecr/RepoUploaderRole";

interface ContainerTaskProps {
    taskEnvironment: [string],
    repoUploaderPrincipal: IPrincipal,
    invokerFunctionProps: FunctionProps,
    taskProps?: FargateTaskDefinitionProps,
    repo?: Repository
}

export class ContainerTask extends Construct {
    public readonly TaskRunner: IFunction;
    constructor(scope: Construct,
                id: string,
                props: ContainerTaskProps) {
        super(scope, id);

        const repo = props.repo || new Repository(this, 'Repo');
        const imageUploaderRole = new RepoUploaderRole(this, props.repoUploaderPrincipal, repo);
        const containerImage = ContainerImage.fromEcrRepository(repo);
        const task = new FargateContainerTaskDefinition(this, 'ContainerTask', props.taskEnvironment, containerImage, props.taskProps);
        const runTaskRole = new FargateTaskDefinitionRunTaskRole(task);
        const runner = new Function(this, 'RunTaskLambda', {role: runTaskRole, ...props.invokerFunctionProps });

        new CfnOutput(this, 'RunTaskLambdaArn', { value: runner.functionArn });
        new CfnOutput(this, 'ContainerRepoURI', { value: repo.repositoryUri });
        new CfnOutput(this, 'ContainerRepoUploaderRoleArn', {  value: imageUploaderRole.roleArn });
        this.TaskRunner = runner;
    }
}