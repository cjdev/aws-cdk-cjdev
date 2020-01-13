import {Effect, IPrincipal, Role} from "@aws-cdk/aws-iam";
import {Repository} from "@aws-cdk/aws-ecr";
import {PolicyDocumentOverPolicyStatements} from "./index";
import {Construct} from "@aws-cdk/core";

export class RepoUploaderRole extends Role {
    constructor(scope: Construct,
                id: string,
                repo: Repository,
                principal: IPrincipal) {
        super(scope, id, {
            assumedBy: principal,
            inlinePolicies: PolicyDocumentOverPolicyStatements.asRoleInlinePolicies([
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
        });
    }
}