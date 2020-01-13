import {expect as expectStack, haveResource} from '@aws-cdk/assert';
import {Stack, App} from '@aws-cdk/core';
import {Repository} from "@aws-cdk/aws-ecr";
import {ContainerImage} from "@aws-cdk/aws-ecs";
import {FargateContainerTaskDefinition} from "../lib/ecs/FargateContainerTaskDefinition";


describe('FargateContainerTaskDefinition', () => {

    //TODO: Weak test : only confirms existence not values
    it('container secrets if task environment is given', () => {
        // given
        const app = new App();
        const stack = new Stack(app, "TestStack");
        const repo = new Repository(stack, "TestRepo");
        const image = ContainerImage.fromEcrRepository(repo);
        const taskEnvVars = ['One', 'Two'];

        // when
        new FargateContainerTaskDefinition(stack, "TestTarget", image,taskEnvVars);

        // then
        expectStack(stack).to(haveResource("AWS::SecretsManager::Secret"));
    });

    it('no container secrets if task environment is not given', () => {
        // given
        const app = new App();
        const stack = new Stack(app, "TestStack");
        const repo = new Repository(stack, "TestRepo");
        const image = ContainerImage.fromEcrRepository(repo);

        // when
        new FargateContainerTaskDefinition(stack, "TestTarget", image);

        // then
        expectStack(stack).notTo(haveResource("AWS::SecretsManager::Secret"));
    });

    it('no container secrets if task environment is empty', () => {
        // given
        const app = new App();
        const stack = new Stack(app, "TestStack");
        const repo = new Repository(stack, "TestRepo");
        const image = ContainerImage.fromEcrRepository(repo);

        // when
        new FargateContainerTaskDefinition(stack, "TestTarget", image, []);

        // then
        expectStack(stack).notTo(haveResource("AWS::SecretsManager::Secret"));
    });
});
