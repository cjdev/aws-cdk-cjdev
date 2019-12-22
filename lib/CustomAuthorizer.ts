import {Construct} from "@aws-cdk/core";
import {IFunction} from "@aws-cdk/aws-lambda";
import {FunctionWithExecutionRole, FunctionWithExecutionRoleProps} from "./FunctionWithExecutionRole";
import {createRole} from "./aws/Roles";
import {createInvokeLambdaPolicy} from "./aws/Policies";
import {CfnAuthorizer, RestApi} from "@aws-cdk/aws-apigateway";
import {apiGatewayServicePrinciple} from "./aws/Principles";

export class CustomAuthorizer extends Construct {
    public readonly Function: IFunction;
    public readonly CfnAuthorizer: CfnAuthorizer;

    constructor(parent: Construct,
                api: RestApi,
                authorizerFunctionProps: FunctionWithExecutionRoleProps) {
        super(parent, name);

        const authorizer = new FunctionWithExecutionRole(this, 'AuthorizerFunction', authorizerFunctionProps);
        const invokeAuthorizerFunctionRole = createRole(this,
            'InvokeAuthorizer',
            [createInvokeLambdaPolicy(this, 'Authorizer', [authorizer.functionArn])],
            apiGatewayServicePrinciple
        );
        const cfnAuthorizer = new CfnAuthorizer(this, 'Authorizer', {
            restApiId: api.restApiId,
            type: 'TOKEN',
            authorizerCredentials: invokeAuthorizerFunctionRole.roleArn,
            authorizerResultTtlInSeconds: 0, // this is required to avoid random authorization denials
            authorizerUri: `arn:aws:apigateway:${authorizer.stack.region}:lambda:path/2015-03-31/functions/${authorizer.functionArn}/invocations`,
            name: `Authorizer`,
            identitySource: 'method.request.header.Authorization'
        });

        this.Function = authorizer;
        this.CfnAuthorizer = cfnAuthorizer;
    }
}
