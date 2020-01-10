import {Construct} from "@aws-cdk/core";
import {ManagedPolicy, PolicyStatement, PolicyStatementProps} from "@aws-cdk/aws-iam";

export class ManagedPolicyOverPolicyStatements extends ManagedPolicy{
    public static asRoleManagedPolicies(scope: Construct, id: string, policyStatements: Array<PolicyStatementProps>): [ManagedPolicy]{
        return [new ManagedPolicyOverPolicyStatements(scope,id,policyStatements)];
    };

    constructor(scope: Construct, id: string, policyStatements: Array<PolicyStatementProps>) {
        super(scope, id, {
            statements: policyStatements.map(ps => new PolicyStatement(ps))
        });
    }
}