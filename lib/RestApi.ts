import {Construct} from "@aws-cdk/core";
import {AuthorizationType, CfnAuthorizer, LambdaIntegration, RestApi} from "@aws-cdk/aws-apigateway";
import {Function, FunctionProps} from "@aws-cdk/aws-lambda";
import {Effect, ManagedPolicy, ServicePrincipal} from "@aws-cdk/aws-iam";
import {createManagedPolicy} from "./internal";
import {RoleWithOutputs} from './RoleWithOutputs'

class InvokeFunctionRole extends RoleWithOutputs {
    constructor(scope: Function) {
        super(scope, 'InvokeFunctionPolicy', {
                assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
                managedPolicies: [
                    createManagedPolicy(scope, 'InvokeFunctionPolicy', [{
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

class RestApiCustomAuthorizer extends CfnAuthorizer {
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

class RestApiWithCustomAuthorizer extends RestApi {
    public readonly Authorizer : CfnAuthorizer;

    constructor(parent: Construct,
                id: string,
                authorizerFunctionProps: FunctionProps) {
        super(parent, id, {
            deploy: true,
            deployOptions: {stageName: "v1"}
        });

        this.Authorizer = new RestApiCustomAuthorizer(this,'Custom', authorizerFunctionProps);
    }
}

class RestApiProxyWithCustomAuthorizer extends RestApiWithCustomAuthorizer {
    constructor(parent: Construct,
                id: string,
                proxyFunctionProps: FunctionProps,
                authorizerFunctionProps: FunctionProps) {
        super(parent, id, authorizerFunctionProps);

        const proxyFunction = new Function(this, 'ProxyFunction', proxyFunctionProps);

        this.root.addMethod('ANY');
        this.root
            .addResource('{proxy+}')
            .addMethod('ANY',
                new LambdaIntegration(proxyFunction, {proxy: true}), {
                    authorizationType: AuthorizationType.CUSTOM,
                    authorizer: { authorizerId: this.Authorizer.ref }
                }
            );
    }
}

export {
    RestApiWithCustomAuthorizer,
    RestApiProxyWithCustomAuthorizer
}