import {Effect, ManagedPolicy, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {Function} from "@aws-cdk/aws-lambda";
import {ManagedPolicyOverPolicyStatements} from "../iam/ManagedPolicyOverPolicyStatements";

export class InvokeFunctionRole extends Role {
    constructor(scope: Function) {
        super(scope, 'InvokeFunctionPolicy', {
                assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
                managedPolicies: [
                    new ManagedPolicyOverPolicyStatements(scope, 'InvokeFunctionStatement', [{
                        actions: ['lambda:invokeFunction'],
                        resources: [scope.functionArn],
                        effect: Effect.ALLOW
                    }]),
                    ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
                ]
            }
        );

    }
}