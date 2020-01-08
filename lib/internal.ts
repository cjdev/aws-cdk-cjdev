import {Construct} from "@aws-cdk/core";
import {
    ManagedPolicy,
    PolicyStatement, PolicyStatementProps,
    PrincipalBase,
    ServicePrincipal
} from "@aws-cdk/aws-iam";
import {Secret as EcsSecret} from "@aws-cdk/aws-ecs/lib/container-definition";
import {Secret as SmSecret} from "@aws-cdk/aws-secretsmanager/lib/secret";

const createLambdaPrinciple = () : PrincipalBase => new ServicePrincipal('lambda.amazonaws.com');
const createApiGateWayPrinciple = () : PrincipalBase => new ServicePrincipal('apigateway.amazonaws.com');

const createManagedPolicy = (scope: Construct, name: string, policyStatements: PolicyStatementProps[]) =>
    new ManagedPolicy(scope,name, { statements: createAllowPolicyStatements(policyStatements) });

const createAllowPolicyStatements = (policyStatements: PolicyStatementProps[]) =>
           policyStatements.map(ps => new PolicyStatement(ps));

const createNamespacedEcsSecrets = (scope: Construct, namespace: string, names: string[]): { [key:string]: EcsSecret } => {
    const smSec = (name: string) => new SmSecret(scope, name, { "secretName": namespace + name });
    const ecsSec = (name: string) => EcsSecret.fromSecretsManager(smSec(name));
    return names.reduce((acc, name) => Object.assign(acc, { [name]: ecsSec(name) }), {});
};

export {
    createApiGateWayPrinciple,
    createManagedPolicy,
    createNamespacedEcsSecrets,
    createLambdaPrinciple
}