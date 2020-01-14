import {Secret} from "@aws-cdk/aws-secretsmanager/lib/secret";
import {Construct} from "@aws-cdk/core";

const createNamedSpacedSecretHashMap = (scope: Construct, namespace: string, names: string[]) => {
    let result : { [key:string]: Secret } = {};
    names.forEach(key => result[key] = createNamespacedSecret(scope, namespace, key));
    return result;
};

const createNamespacedSecret = (scope: Construct, namespace: string, name: string) =>
    new Secret(scope, name, { "secretName": `${namespace}${name}` });

export{
    createNamedSpacedSecretHashMap,
    createNamespacedSecret
}