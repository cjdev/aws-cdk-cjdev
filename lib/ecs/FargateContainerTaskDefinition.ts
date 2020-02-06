import {Construct} from "@aws-cdk/core";
import * as ecs from "@aws-cdk/aws-ecs";
import * as sm from "@aws-cdk/aws-secretsmanager/lib/secret";

export class FargateContainerTaskDefinition extends ecs.FargateTaskDefinition {
    constructor(scope: Construct,
                id: string,
                image: ecs.ContainerImage,
                taskProps: ecs.FargateTaskDefinitionProps,
                secrets?: { [key:string]: sm.Secret }) {
        super(scope, id, taskProps);

        let cdProps: ecs.ContainerDefinitionOptions = {
            image,
            logging: ecs.LogDriver.awsLogs({
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
    private static createEcsSecrets(secrets: { [key:string]: sm.Secret }): { [key:string]: ecs.Secret }{
        let result : { [key:string]: ecs.Secret } = {};
        Object.entries(secrets).map(([key, value]) => result[key] = ecs.Secret.fromSecretsManager(value));
        return result;
    };
}