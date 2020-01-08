import {CfnOutput, Construct} from "@aws-cdk/core";
import {Role, RoleProps} from "@aws-cdk/aws-iam";

export class RoleWithOutputs extends Role {
    constructor(scope: Construct, id: string, props: RoleProps) {
        super(scope, id, props);
        new CfnOutput(scope, `${id}Arn`, {value: this.roleArn});
    }
}
