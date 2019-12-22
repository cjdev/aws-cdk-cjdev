import {Construct} from "@aws-cdk/core";
import {AuthorizationType, CfnAuthorizer, LambdaIntegration, RestApi} from "@aws-cdk/aws-apigateway";
import {Function, FunctionProps, IFunction} from "@aws-cdk/aws-lambda";
import {createAllowPolicy, createRole} from "./internal";
import {ServicePrincipal} from "@aws-cdk/aws-iam";

class ProxyApiWithCustomAuthorizer extends RestApi {
    constructor(parent: Construct,
                name: string,
                proxyFunctionProps: FunctionProps,
                authorizerFunctionProps: FunctionProps) {
        super(parent,`${name}RestApi`, {
                deploy: true,
                deployOptions: {stageName: "v1"}
        });

        const customAuthorizer = new CustomAuthorizer(parent,`${name}RestApi`, this, authorizerFunctionProps);
        const proxyFunction = new Function(parent, `${name}ProxyFunction`, proxyFunctionProps);

        this.root.addMethod('ANY');
        this.root
            .addResource('{proxy+}')
            .addMethod('ANY',
                new LambdaIntegration(proxyFunction, {proxy: true}), {
                    authorizationType: AuthorizationType.CUSTOM,
                    authorizer: { authorizerId: customAuthorizer.CfnAuthorizer.ref }
                }
            );
    }
}

class CustomAuthorizer extends Construct {
    public readonly Function: IFunction;
    public readonly CfnAuthorizer: CfnAuthorizer;

    constructor(parent: Construct, name: string, api: RestApi, functionProps: FunctionProps) {
        super(parent, `${name}CustomAuthorizer`);

        const authorizerFunction = new Function(this, 'AuthorizerFunction', functionProps);
        const invokeRole = createRole(this,
            'AuthorizerInvokerRole',
            new ServicePrincipal('apigateway.amazonaws.com'),
            [
                createAllowPolicy(this, 'AuthorizerInvokerPolicy', ['lambda:invokeFunction'],[authorizerFunction.functionArn])
            ]
        );
        const cfnAuthorizer = new CfnAuthorizer(this, 'AuthorizerCnf', {
            restApiId: api.restApiId,
            type: 'TOKEN',
            authorizerCredentials: invokeRole.roleArn,
            authorizerResultTtlInSeconds: 0, // this is required to avoid random authorization denials
            authorizerUri: `arn:aws:apigateway:${authorizerFunction.stack.region}:lambda:path/2015-03-31/functions/${authorizerFunction.functionArn}/invocations`,
            name: 'AuthorizerCnfProps',
            identitySource: 'method.request.header.Authorization'
        });

        this.Function = authorizerFunction;
        this.CfnAuthorizer = cfnAuthorizer;
    }
}

export { ProxyApiWithCustomAuthorizer }