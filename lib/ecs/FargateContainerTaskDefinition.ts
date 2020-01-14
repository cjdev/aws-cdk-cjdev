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

export class FargateContainerTaskDefinition extends FargateTaskDefinition {
    constructor(scope: Construct,
                id: string,
                image: ContainerImage,
                taskProps: FargateTaskDefinitionProps,
                secrets?: { [key:string]: SmSecret }) {
        super(scope, id, taskProps);

        let cdProps: ContainerDefinitionOptions = {
            image,
            logging: LogDriver.awsLogs({
                streamPrefix: `${id}ContainerLog`
            })
        };

        if(secrets){
            cdProps = {
                ...cdProps,
                secrets: FargateContainerTaskDefinition.createEcsSecrets(secrets)}
        }

        this.addContainer(`${id}Container`, cdProps);
    }
    private static createEcsSecrets(secrets: { [key:string]: SmSecret }): { [key:string]: EcsSecret }{
        let result : { [key:string]: EcsSecret } = {};
        Object.entries(secrets).map(([key, value]) => result[key] = EcsSecret.fromSecretsManager(value));
        return result;
    };
}