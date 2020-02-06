import * as cdk from "@aws-cdk/core";
import * as acm from '@aws-cdk/aws-certificatemanager';

export class ValidatedCertificate extends acm.Certificate{
    constructor(scope: cdk.Construct, id:string, domainName: string, validationDomainName: string) {
        super(scope, id, {
            domainName: domainName,
            validationDomains: ValidatedCertificate.createValidationDomains(domainName, validationDomainName),
            validationMethod: acm.ValidationMethod.DNS
        });
    }
    private static createValidationDomains = (domainName: string, validationDomainName: string) => {
        let result:{ [domainName: string]: string; } = {};
        result[domainName] = validationDomainName;
        return result
    };
}
