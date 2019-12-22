import {expect as expectStack, haveResource} from '@aws-cdk/assert';
import {Stack, App} from '@aws-cdk/core';
import {Code, Runtime} from "@aws-cdk/aws-lambda";
import {ProxyApiWithCustomAuthorizer} from "../lib";

describe('ProxyApiWithCustomAuthorizer', () => {
    it('has a proxy resource for all http methods', () => {
        // given
        const app = new App();
        const stack = new Stack(app, "TestStack");
        const functionProps = {
            handler: "index.handler",
            runtime: Runtime.NODEJS_12_X,
            executionPolicies: [],
            code: Code.fromAsset('test/testCodeAsset1.zip', {})
        };

        // when
        new ProxyApiWithCustomAuthorizer(stack, "TestProxyApi",functionProps,functionProps);

        // then
        expectStack(stack).to(haveResource("AWS::ApiGateway::RestApi"));
        expectStack(stack).to(haveResource("AWS::ApiGateway::Resource", {PathPart:"{proxy+}"}));  // RestApiId: actual.RestApi.restApiId is a token
        expectStack(stack).to(haveResource("AWS::ApiGateway::Method", {HttpMethod:"ANY"}));
    });

    // it('integrates a proxy function with provided function props', () => {
    //     const stack = createTestStack();
    //     const proxyProps = {
    //         handler: "index.proxyHandler",
    //         runtime: Runtime.NODEJS_12_X,
    //         code: Code.fromAsset('test/testCodeAsset1.zip', {})
    //     };
    //     const authProps =  {
    //         handler: "index.authHandler",
    //         runtime: Runtime.NODEJS_10_X,
    //         code: Code.fromAsset('test/testCodeAsset2.zip', {})
    //     };
    //
    //     // when
    //     new ProxyApiWithCustomAuthorizer(stack,"TextProxyApi", proxyProps, authProps);
    // });
    //
    // it('uses an authorizer function with provided function props', () => {
    //     const stack = createTestStack();
    // });
    //
    // it('outputs the apis url', () => {
    //     const stack = createTestStack();
    // });
});