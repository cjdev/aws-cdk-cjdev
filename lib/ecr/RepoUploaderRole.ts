import {Effect, IPrincipal, Role} from "@aws-cdk/aws-iam";
import {Repository} from "@aws-cdk/aws-ecr";
import {ManagedPolicyOverPolicyStatements} from "../iam/ManagedPolicyOverPolicyStatements";
import {Construct} from "@aws-cdk/core";

export class RepoUploaderRole extends Role {
    constructor(scope: Construct,
                id: string,
                repo: Repository,
                principal: IPrincipal) {
        super(scope, id, {
            assumedBy: principal,
            managedPolicies: [
                new ManagedPolicyOverPolicyStatements(scope, 'ContainerRepoUploaderPolicy', [
                    {
                        effect: Effect.ALLOW,
                        resources: [repo.repositoryArn],
                        actions: ['ecr:PutImage', 'ecr:BatchCheckLayerAvailability', 'ecr:UploadLayerPart', 'ecr:InitiateLayerUpload', 'ecr:CompleteLayerUpload']
                    },
                    {
                        effect: Effect.ALLOW,
                        resources: ["*"],
                        actions: ['ecr:GetAuthorizationToken']
                    }
                ])
            ]
        });
    }
}