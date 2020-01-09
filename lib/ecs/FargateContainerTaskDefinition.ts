import {ContainerImage, FargateTaskDefinition, FargateTaskDefinitionProps, LogDriver} from "@aws-cdk/aws-ecs";
import {CfnOutput, Construct} from "@aws-cdk/core";
import {Secret as EcsSecret} from "@aws-cdk/aws-ecs/lib/container-definition";
import {Secret as SmSecret} from "@aws-cdk/aws-secretsmanager/lib/secret";

const createNamespacedEcsSecrets = (scope: Construct, namespace: string, names: string[]): { [key:string]: EcsSecret } => {
    const smSec = (name: string) => new SmSecret(scope, name, { "secretName": namespace + name });
    const ecsSec = (name: string) => EcsSecret.fromSecretsManager(smSec(name));
    return names.reduce((acc, name) => Object.assign(acc, { [name]: ecsSec(name) }), {});
};

export class FargateContainerTaskDefinition extends FargateTaskDefinition {
    constructor(scope: Construct,
                id: string,
                taskEnvironment: [string],
                image: ContainerImage,
                taskProps?: FargateTaskDefinitionProps) {
        super(scope, id, taskProps);

        this.addContainer(`${id}Container`, {
            image,
            secrets: createNamespacedEcsSecrets(scope, id, taskEnvironment),
            logging: LogDriver.awsLogs({
                streamPrefix: `${id}ContainerLog`
            })
        });
        new CfnOutput(this, 'TaskDefinitionArn', {value: this.taskDefinitionArn});
    }
}