import {Construct} from "@aws-cdk/core";
import {FunctionProps, IFunction} from "@aws-cdk/aws-lambda";
import {AuthorizationType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {RestApiWithCustomAuthorizer} from "./RestApiWithCustomAuthorizer";

class RestApiProxyWithCustomAuthorizer extends RestApiWithCustomAuthorizer {
    public readonly ProxyFunction: IFunction;

    constructor(scope: Construct,
                id: string,
                proxyFunction: IFunction,
                authorizerFunctionProps: FunctionProps) {
        super(scope, id, authorizerFunctionProps);

        this.root.addMethod('ANY');
        this.root
            .addResource('{proxy+}')
            .addMethod('ANY',
                new LambdaIntegration(proxyFunction, {proxy: true}), {
                    authorizationType: AuthorizationType.CUSTOM,
                    authorizer: {authorizerId: this.Authorizer.ref}
                }
            );

        this.ProxyFunction = proxyFunction;
    }
}

export {RestApiProxyWithCustomAuthorizer};