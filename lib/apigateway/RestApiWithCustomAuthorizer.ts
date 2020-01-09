import {CfnAuthorizer, RestApi} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {FunctionProps} from "@aws-cdk/aws-lambda";
import {RestApiCustomAuthorizer} from "./RestApiCustomAuthorizer";

class RestApiWithCustomAuthorizer extends RestApi {
    public readonly Authorizer: CfnAuthorizer;

    constructor(parent: Construct,
                id: string,
                authorizerFunctionProps: FunctionProps) {
        super(parent, id, {
            deploy: true,
            deployOptions: {stageName: "v1"}
        });

        this.Authorizer = new RestApiCustomAuthorizer(this, 'Custom', authorizerFunctionProps);
    }
}

export {RestApiWithCustomAuthorizer};