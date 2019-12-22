import {Construct} from "@aws-cdk/core";
import {TaskDefinition, TaskDefinitionProps} from "@aws-cdk/aws-ecs";
import {IManagedPolicy} from "@aws-cdk/aws-iam";
import {createAllowPolicy} from "./internal";

export class InvocableTask extends TaskDefinition {
    public readonly RunPolicy: IManagedPolicy;

    constructor(parent: Construct, name: string, props: TaskDefinitionProps) {
        super(parent, name, props);
        this.RunPolicy = createAllowPolicy(this, `${name}RunPolicy`, ['ecs:RunTask'], [this.taskDefinitionArn]);
    }
}