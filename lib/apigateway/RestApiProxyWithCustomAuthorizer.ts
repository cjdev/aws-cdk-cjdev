import {Construct} from "@aws-cdk/core";
import {Function, FunctionProps} from "@aws-cdk/aws-lambda";
import {AuthorizationType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {RestApiWithCustomAuthorizer} from "./RestApiWithCustomAuthorizer";

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
                    authorizer: {authorizerId: this.Authorizer.ref}
                }
            );
    }
}

export {RestApiProxyWithCustomAuthorizer};