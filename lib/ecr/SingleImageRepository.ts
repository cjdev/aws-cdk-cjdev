import {CfnOutput, Construct} from "@aws-cdk/core";
import {Repository} from "@aws-cdk/aws-ecr";
import {ContainerImage, EcrImage} from "@aws-cdk/aws-ecs";

export class SingleImageRepository extends Repository {
    public readonly Image: EcrImage;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.Image = ContainerImage.fromEcrRepository(this);
    }
}