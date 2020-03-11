import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as iam from "@aws-cdk/aws-iam";
import * as cdk from "@aws-cdk/core";
import * as logs from '@aws-cdk/aws-logs';

export interface FargateContainerServiceProps{
    vpc: ec2.IVpc,
    subnets: ec2.ISubnet [],
    applicationPorts: number[],
    taskCpu: number,
    taskMemoryLimitMiB: number,
    taskRoleManagedPolicies: iam.IManagedPolicy[],
    taskSecurityGroup: ec2.ISecurityGroup,
    containerName: string,
    containerImage: ecs.ContainerImage,
    containerEnvironment: { [key: string]: string; },
    containerSecrets: { [key: string]: ecs.Secret; };
};

export class FargateContainerService extends cdk.Construct {
    public readonly fargateService: ecs.FargateService;

    constructor(scope: cdk.Construct, id: string, props: FargateContainerServiceProps) {
        super(scope, id);

        const serviceSecretsPolicy = new iam.ManagedPolicy(this, 'secrets-policy', {
            statements: [new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'secretsmanager:GetSecretValue'
                ],
                resources: ['*']
            })]
        });

        const serviceLogPolicy = new iam.ManagedPolicy(this, 'log-policy', {
            statements: [new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources: ['*']
            })]
        });

        const serviceContainerUsePolicy = new iam.ManagedPolicy(this, 'container-policy', {
            statements: [new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "ecs:DeregisterContainerInstance",
                    "ecs:DiscoverPollEndpoint",
                    "ecs:Poll",
                    "ecs:RegisterContainerInstance",
                    "ecs:StartTelemetrySession",
                    "ecs:Submit*",
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage",
                ],
                resources: ['*']
            })]
        });

        const taskExecutionRole = new iam.Role(this, 'task-execution-role', {
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('ecs.amazonaws.com'),
                new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
            ),
            managedPolicies: [
                serviceSecretsPolicy,
                serviceLogPolicy,
                serviceContainerUsePolicy
            ]
        });

        const taskRole = new iam.Role(this, 'task-role', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: props.taskRoleManagedPolicies
        });

        const task = new ecs.FargateTaskDefinition(this, 'task-definition', {
            cpu: props.taskCpu,
            memoryLimitMiB: props.taskMemoryLimitMiB,
            taskRole: taskRole,
            executionRole: taskExecutionRole,
        });

        const taskContainerLogGroup = new logs.LogGroup(this, 'log-group', {
            logGroupName: `${id}LogGroup`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.TWO_WEEKS
        });

        const taskContainer = task.addContainer(props.containerName, {
            image: props.containerImage,
            logging: ecs.LogDriver.awsLogs({
                streamPrefix: id,
                logGroup: taskContainerLogGroup
            }),
            environment: props.containerEnvironment,
            secrets: props.containerSecrets
        });
        taskContainer.addPortMappings(...props.applicationPorts.map(port => {
            return { containerPort: port, hostPort: port
            }}));

        const taskServiceCluster = new ecs.Cluster(this, 'service-cluster', {
            vpc: props.vpc,
        });

        this.fargateService = new ecs.FargateService(this, 'service', {
            cluster: taskServiceCluster,
            vpcSubnets: { subnets: props.subnets },
            taskDefinition: task,
            desiredCount: 1,
            securityGroup: props.taskSecurityGroup
        });
    }
}
