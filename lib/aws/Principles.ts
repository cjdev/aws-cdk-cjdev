import {ServicePrincipal} from "@aws-cdk/aws-iam";

const apiGatewayServicePrinciple = new ServicePrincipal('apigateway.amazonaws.com');
const lambdaServicePrinciple = new ServicePrincipal('lambda.amazonaws.com');

export {
    apiGatewayServicePrinciple,
    lambdaServicePrinciple
}