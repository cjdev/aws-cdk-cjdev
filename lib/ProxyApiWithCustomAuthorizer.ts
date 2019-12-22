import {CfnOutput, Construct} from "@aws-cdk/core";
import {FunctionWithExecutionRole, FunctionWithExecutionRoleProps} from "./FunctionWithExecutionRole";
import {AuthorizationType, LambdaIntegration, RestApi} from "@aws-cdk/aws-apigateway";
import {IFunction} from "@aws-cdk/aws-lambda";
import {CustomAuthorizer} from "./CustomAuthorizer";


export class ProxyApiWithCustomAuthorizer extends RestApi {
    public readonly ProxyFunction: IFunction;
    public readonly AuthorizerFunction: IFunction;

    constructor(parent: Construct,
                name: string,
                proxyFunctionProps: FunctionWithExecutionRoleProps,
                authorizerFunctionProps: FunctionWithExecutionRoleProps) {
        super(parent, `${name}RestApi`, {
            deploy: true,
            deployOptions: {stageName: "v1"}
        });

        const customAuthorizer = new CustomAuthorizer(parent, this, authorizerFunctionProps);
        const proxyFunction = new FunctionWithExecutionRole(parent, 'ProxyFunction', proxyFunctionProps);

        this.root.addMethod('ANY');
        this.root
            .addResource('{proxy+}')
            .addMethod('ANY',
                new LambdaIntegration(proxyFunction, {proxy: true}), {
                    authorizationType: AuthorizationType.CUSTOM,
                    authorizer: { authorizerId: customAuthorizer.CfnAuthorizer.ref }
                }
            );

        this.ProxyFunction = proxyFunction;
        this.AuthorizerFunction = customAuthorizer.Function;
    }
}

