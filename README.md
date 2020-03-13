# CJ Engineering CDK Construct Library (TypeScript)

![Stability](https://img.shields.io/static/v1?label=Stability&message=Experimental&color=important&style=for-the-badge)
![npm (scoped)](https://img.shields.io/npm/v/@jmwindsor/aws-cdk-cjdev?style=for-the-badge)
![GitHub](https://img.shields.io/github/license/cjdev/aws-cdk-cjdev?style=for-the-badge)


```$javascript

import {ProxyApi} from "@cjdev/aws-cdk-cjdev";
import {App, Stack} from "@aws-cdk/core";

const app = new App();
const stack = new Stack(app,'StackName');

new ProxyApi(bas, "RestProxyApi",
    "<path-to>/<proxy lambda function code>.zip",
    "../build/authorization-lambda.zip"
);

```
