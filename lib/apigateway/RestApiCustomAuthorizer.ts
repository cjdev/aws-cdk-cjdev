import {CfnAuthorizer, RestApi} from "@aws-cdk/aws-apigateway";
import {Function, FunctionProps} from "@aws-cdk/aws-lambda";
import {InvokeFunctionRole} from "./InvokeFunctionRole";

export class RestApiCustomAuthorizer extends CfnAuthorizer {
    constructor(api: RestApi,
                id: string,
                functionProps: FunctionProps) {
        super(api, 'AuthorizerCnf', {
            restApiId: api.restApiId,
            type: 'TOKEN'
        });

        const authorizerFunction = new Function(this, 'AuthorizerFunction', functionProps);
        const invokeRole = new InvokeFunctionRole(authorizerFunction);

        this.authorizerCredentials = invokeRole.roleArn;
        this.authorizerResultTtlInSeconds = 0; // this is required to avoid random authorization denials
        this.authorizerUri = `arn:aws:apigateway:${authorizerFunction.stack.region}:lambda:path/2015-03-31/functions/${authorizerFunction.functionArn}/invocations`;
        this.identitySource = 'method.request.header.Authorization';
    }
}