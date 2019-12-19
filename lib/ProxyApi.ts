import {Construct} from "@aws-cdk/core";
import {createProxyApiWithAuthorizer} from "./aws/GatewayApi";
import {createExecutableFunction} from "./aws/Lambda";

export class ProxyApi extends Construct {
    constructor(parent: Construct,
                name: string,
                proxyFunctionAssetPath: string,
                authorizationFunctionAssetPath: string) {
        super(parent, name);

        const proxy = createExecutableFunction(parent, {
            name: `ProxyFunction`,
            assetPath: proxyFunctionAssetPath
        });

        const authorizer = createExecutableFunction(parent, {
            name: `AuthorizerFunction`,
            assetPath: authorizationFunctionAssetPath
        });

        const api = createProxyApiWithAuthorizer(parent, proxy, authorizer);
    }
};
