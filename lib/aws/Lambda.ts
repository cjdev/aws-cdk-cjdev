import {IManagedPolicy, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {CfnOutput, Construct} from "@aws-cdk/core";
import {Code, IFunction, Function, Runtime} from "@aws-cdk/aws-lambda";

interface FunctionProps {
    assetPath: string,
    name: string,
    roleManagedPolicies?: IManagedPolicy[],
    functionEnv?: { [key: string]: string }
}

const createExecutionRole = (scope: Construct, name: string, roleManagedPolicies: IManagedPolicy[]) => {
    const role = new Role(scope, `${name}ExecutionRole`, {
            managedPolicies: roleManagedPolicies,
            assumedBy: new ServicePrincipal('lambda.amazonaws.com')
        });

    new CfnOutput(scope,
        `${name}FunctionExecutionRoleArn`,
        { value: role.roleArn }
    );

    return role;
};

const createExecutableFunction = (scope: Construct, {assetPath, name, roleManagedPolicies, functionEnv}: FunctionProps) : IFunction => {

    const role = (roleManagedPolicies)
        ? createExecutionRole(scope, name, roleManagedPolicies)
        : undefined;

    return new Function(scope, name, {
        handler: 'src/index.handler',
        runtime: Runtime.NODEJS_10_X,
        code: Code.fromAsset(assetPath),
        environment: functionEnv,
        role
    });
};


export {
    createExecutableFunction
}