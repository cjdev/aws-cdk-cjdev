import {CfnOutput, Construct} from "@aws-cdk/core";
import {
    CompositePrincipal,
    IManagedPolicy,
    PrincipalBase,
    Role
} from "@aws-cdk/aws-iam";

const createRole = (scope: Construct,
                    name: string,
                    managedPolicies: IManagedPolicy[],
                    ...principles: PrincipalBase[]) => {
    const roleName = `${name}Role`;
    const role = new Role(scope, roleName, {
        managedPolicies: managedPolicies,
        assumedBy: new CompositePrincipal(...principles),
    });

    new CfnOutput(scope, `${roleName}Arn`, { value: role.roleArn });

    return role;
};

export {
    createRole
}