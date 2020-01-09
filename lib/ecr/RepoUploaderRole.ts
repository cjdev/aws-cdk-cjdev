import {Construct} from "@aws-cdk/core";
import {Effect, IPrincipal, Role} from "@aws-cdk/aws-iam";
import {Repository} from "@aws-cdk/aws-ecr";
import {ManagedPolicyOverPolicyStatements} from "../iam/ManagedPolicyOverPolicyStatements";

export class RepoUploaderRole extends Role {
    constructor(scope: Construct,
                principal: IPrincipal,
                builderContainerRepo: Repository) {
        super(scope, 'ContainerRepoUploaderRole', {
            assumedBy: principal,
            managedPolicies: [
                new ManagedPolicyOverPolicyStatements(scope, 'ContainerRepoUploaderPolicy', [
                    {
                        effect: Effect.ALLOW,
                        resources: [builderContainerRepo.repositoryArn],
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