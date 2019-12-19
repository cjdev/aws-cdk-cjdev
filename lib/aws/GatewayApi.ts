import {CfnOutput, Construct} from "@aws-cdk/core";
import {IFunction} from "@aws-cdk/aws-lambda";
import {AuthorizationType, CfnAuthorizer, LambdaIntegration, RestApi} from "@aws-cdk/aws-apigateway";
import {Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from "@aws-cdk/aws-iam";

const createProxyApiWithAuthorizer = (scope: Construct,
                                      proxyFunction: IFunction,
                                      authorizerFunction: IFunction) => {

    const api = new RestApi(scope, "RestApi", {
        deploy: true,
        deployOptions: {stageName: "v1"}
    });

    const proxyIntegration = new LambdaIntegration(proxyFunction, {proxy: true});
    const authorizerWrapper = cnfAuthorizer(scope, api.restApiId, authorizerFunction);

    api.root.addMethod('ANY');
    api.root
        .addResource('{proxy+}')
        .addMethod('ANY', proxyIntegration, {
            authorizationType: AuthorizationType.CUSTOM,
            authorizer: { authorizerId: authorizerWrapper.ref }
        });

    new CfnOutput(scope,
        `RestApiUrl`,
        { value: api.url }
    );

    return api;
};

const cnfAuthorizer = (scope: Construct,
                       restApiId: string,
                       authorizerFunction: IFunction) => {

    const invokeAuthorizationRole = new Role(scope, `AuthorizerInvokeRole`, {
        managedPolicies: [
            new ManagedPolicy(scope, `AuthorizerInvokePolicy`, {
                statements: [
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['lambda:invokeFunction'],
                        resources: [authorizerFunction.functionArn]
                    })
                ]
            })
        ],
        assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
    });

    return new CfnAuthorizer(scope, 'Authorizer', {
        restApiId,
        type: 'TOKEN',
        authorizerCredentials: invokeAuthorizationRole.roleArn,
        authorizerResultTtlInSeconds: 0, // this is required to avoid random authorization denials
        authorizerUri: `arn:aws:apigateway:${authorizerFunction.stack.region}:lambda:path/2015-03-31/functions/${authorizerFunction.functionArn}/invocations`,
        name: `Authorizer`,
        identitySource: 'method.request.header.Authorization'
    });
};

export{
    createProxyApiWithAuthorizer
}