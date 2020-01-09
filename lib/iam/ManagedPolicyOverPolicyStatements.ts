import {Construct} from "@aws-cdk/core";
import {ManagedPolicy, PolicyStatement, PolicyStatementProps} from "@aws-cdk/aws-iam";

export class ManagedPolicyOverPolicyStatements extends ManagedPolicy{
    constructor(scope: Construct, id: string, policyStatements: Array<PolicyStatementProps>) {
        super(scope, id, { statements: createAllowPolicyStatements(policyStatements) });
    }
}

const createAllowPolicyStatements = (policyStatements: Array<PolicyStatementProps>) =>
    policyStatements.map(ps => new PolicyStatement(ps));