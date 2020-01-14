import {PolicyDocument, PolicyStatement, PolicyStatementProps} from "@aws-cdk/aws-iam";

export class PolicyDocumentOverPolicyStatements extends PolicyDocument{
    public static asRoleInlinePolicies(policyStatementProps: PolicyStatementProps[]): { [name: string]: PolicyDocument; }{
        return { "policy": new PolicyDocumentOverPolicyStatements(policyStatementProps) }
    };

    constructor(policyStatementProps: PolicyStatementProps[]) {
        super({ statements: policyStatementProps.map(ps => new PolicyStatement(ps)) });
    }
}