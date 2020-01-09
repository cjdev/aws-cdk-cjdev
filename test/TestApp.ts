#!/usr/bin/env node
import 'source-map-support/register';
import {SingleContainerApiStack} from "../lib";
import {App} from "@aws-cdk/core";
import {AccountPrincipal} from '@aws-cdk/aws-iam';
import {Code,Runtime} from '@aws-cdk/aws-lambda';

const codePath = './';

const app = new App();
new SingleContainerApiStack(app,'BrowserAdjustments', {
    apiAuthorizerFunctionProps: {
        handler: 'index.handler',
        code: Code.fromAsset(codePath + 'authorization-lambda.zip'),
        runtime: Runtime.NODEJS_12_X
    },
    taskRunnerFunctionProps:  {
        handler: 'index.handler',
        code: Code.fromAsset(codePath + 'replication-lambda.zip'),
        runtime: Runtime.NODEJS_12_X
    },
    repoUploadImageRoleAssumedByPrincipal: new AccountPrincipal(597974043991),
    containerEnvArgs: ['SomeArgNamne']
});
