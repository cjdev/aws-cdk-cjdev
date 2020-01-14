import {CompositePrincipal, Effect, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {Repository} from "@aws-cdk/aws-ecr";
import {Construct} from "@aws-cdk/core";
import {PolicyDocumentOverPolicyStatements} from "./PolicyDocumentOverPolicyStatements";

export class ContainerTaskExecutionRole extends Role {
    constructor(scope: Construct, id: string, repo: Repository, secretIds: string[]) {
        super(scope, id, {
                assumedBy: new CompositePrincipal(
                    new ServicePrincipal('ecs.amazonaws.com'),
                    new ServicePrincipal('ecs-tasks.amazonaws.com')
                ),
                inlinePolicies: PolicyDocumentOverPolicyStatements.asRoleInlinePolicies([
                    {
                        effect: Effect.ALLOW,
                        actions: ['ecr:GetAuthorizationToken'],
                        resources: ['*']
                    },
                    {
                        effect: Effect.ALLOW,
                        actions: [
                            'ecr:BatchCheckLayerAvailability',
                            'ecr:GetDownloadUrlForLayer',
                            'ecr:BatchGetImage'
                        ],
                        resources: [repo.repositoryArn]
                    },
                    {
                        effect: Effect.ALLOW,
                        actions: ['secretsmanager:GetSecretValue'],
                        resources: secretIds
                    },
                    {
                        effect: Effect.ALLOW,
                        actions: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        resources: ['arn:aws:logs:*:*:*']
                    }
                    ])
            }
        );
    }
}