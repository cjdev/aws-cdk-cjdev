import {
    ContainerDefinitionOptions,
    ContainerImage,
    FargateTaskDefinition,
    FargateTaskDefinitionProps,
    LogDriver
} from "@aws-cdk/aws-ecs";
import {Construct} from "@aws-cdk/core";
import {Secret as EcsSecret} from "@aws-cdk/aws-ecs/lib/container-definition";
import {Secret as SmSecret} from "@aws-cdk/aws-secretsmanager/lib/secret";

const createNamespacedEcsSecrets = (scope: Construct, namespace: string, names: Array<string>): { [key:string]: EcsSecret } => {
    const smSec = (name: string) => new SmSecret(scope, name, { "secretName": namespace + name });
    const ecsSec = (name: string) => EcsSecret.fromSecretsManager(smSec(name));
    return names.reduce((acc, name) => Object.assign(acc, { [name]: ecsSec(name) }), {});
};

export class FargateContainerTaskDefinition extends FargateTaskDefinition {
    constructor(scope: Construct,
                id: string,
                image: ContainerImage,
                taskEnvVars?: Array<string>,
                taskProps?: FargateTaskDefinitionProps) {
        super(scope, id, taskProps);

        let cdProps: ContainerDefinitionOptions = {
            image,
            logging: LogDriver.awsLogs({
                streamPrefix: `${id}ContainerLog`
            })
        };

        if(taskEnvVars){
            cdProps = {secrets: createNamespacedEcsSecrets(scope, id, taskEnvVars), ...cdProps}
        }

        this.addContainer(`${id}Container`, cdProps);
    }
}