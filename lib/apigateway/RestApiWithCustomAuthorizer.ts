import {CfnAuthorizer, RestApi} from "@aws-cdk/aws-apigateway";
import {Stack} from "@aws-cdk/core";
import {FunctionProps} from "@aws-cdk/aws-lambda";
import {RestApiCustomAuthorizer} from "./RestApiCustomAuthorizer";

class RestApiWithCustomAuthorizer extends RestApi {
    public readonly Authorizer: CfnAuthorizer;

    constructor(scope: Stack,
                id: string,
                authorizerFunctionProps: FunctionProps) {
        super(scope, id, {
            deploy: true,
            deployOptions: {stageName: "v1"}
        });

        this.Authorizer = new RestApiCustomAuthorizer(scope, 'Custom', this, authorizerFunctionProps);
    }
}

export {RestApiWithCustomAuthorizer};