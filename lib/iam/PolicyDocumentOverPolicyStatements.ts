import {PolicyDocument, PolicyStatement, PolicyStatementProps} from "@aws-cdk/aws-iam";

export class PolicyDocumentOverPolicyStatements extends PolicyDocument{
    public static asRoleInlinePolicies(policyStatements: Array<PolicyStatementProps>): { [name: string]: PolicyDocument; }{
        return { "policy": new PolicyDocumentOverPolicyStatements(policyStatements) }
    };

    constructor(policyStatements: Array<PolicyStatementProps>) {
        super({ statements: policyStatements.map(ps => new PolicyStatement(ps)) });
    }
}