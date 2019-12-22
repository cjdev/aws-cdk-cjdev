import {IManagedPolicy} from "@aws-cdk/aws-iam";
import {Construct} from "@aws-cdk/core";
import {Code, Function, Runtime} from "@aws-cdk/aws-lambda";
import {createRole} from "./aws/Roles";
import {lambdaServicePrinciple} from "./aws/Principles";

interface FunctionWithExecutionRoleProps {
    handler: string,
    runtime: Runtime,
    code: Code,
    executionPolicies: IManagedPolicy[],
    environment?: { [key: string]: string; }
}

class FunctionWithExecutionRole extends Function {
    constructor(parent: Construct,
                name: string,
                { handler, runtime, code, environment, executionPolicies } : FunctionWithExecutionRoleProps) {
        super(parent,
            name,
            {
                handler,
                runtime,
                code,
                environment,
                role: createRole(parent,
                    `${name}ExecutionRole`,
                    executionPolicies,
                    lambdaServicePrinciple)
            }
        );
    }
}

export {
    FunctionWithExecutionRoleProps,
    FunctionWithExecutionRole
}