import {Effect, ManagedPolicy, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {Function} from "@aws-cdk/aws-lambda";
import {Construct} from "@aws-cdk/core";
import {PolicyDocumentOverPolicyStatements} from "../iam";

export class InvokeFunctionRole extends Role {
    constructor(scope: Construct, func: Function) {
        super(scope, 'InvokeFunctionPolicy', {
                assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
                inlinePolicies: PolicyDocumentOverPolicyStatements.asRoleInlinePolicies([
                        {
                            actions: ['lambda:invokeFunction'],
                            resources: [func.functionArn],
                            effect: Effect.ALLOW
                        }
                    ]),
                managedPolicies: [
                    ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
                ]
        });
    }
}