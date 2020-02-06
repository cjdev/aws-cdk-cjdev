import * as ec2 from "@aws-cdk/aws-ec2";
import * as rds from "@aws-cdk/aws-rds";
import * as cdk from "@aws-cdk/core";
import * as sm from '@aws-cdk/aws-secretsmanager';


export interface AuroraServerlessDatabaseClusterProps {
    vpc: ec2.IVpc;
    subnets: ec2.ISubnet[];
    databaseName: string;
    masterUsername: string;
    charset: string;
}

export class AuroraServerlessDatabaseCluster extends rds.CfnDBCluster{
    public readonly securityGroup: ec2.SecurityGroup;
    public readonly masterPassword: sm.Secret;
    public readonly masterUserName: string;

    constructor(scope: cdk.Construct, id: string, props: AuroraServerlessDatabaseClusterProps) {
        super(scope, id,{
            engine: 'aurora',
            engineMode:'serverless',
            databaseName: props.databaseName,
            dbClusterIdentifier: 'aurora-serverless-cluster',
            engineVersion: '5.6.10a',
            masterUsername: props.masterUsername,
            scalingConfiguration: {
                autoPause: true,
                maxCapacity: 4,
                minCapacity: 1,
                secondsUntilAutoPause: 30 * 60
            }
        });
        const masterPasswordSecret = new sm.Secret(this, 'MasterPassword', {
            generateSecretString: { excludePunctuation: true }
        });
        const parameterGroup = new rds.ClusterParameterGroup(this, 'cluster-param-group', {
            family: 'aurora5.6',
            parameters: {
                character_set_client: props.charset,
                character_set_connection: props.charset,
                character_set_database: props.charset,
                character_set_results: props.charset,
                character_set_server: props.charset
            }
        });

        const subnetGroup = new rds.CfnDBSubnetGroup(this, 'cluster-subnet-group', {
            dbSubnetGroupDescription: 'RDSSubnetGroup',
            subnetIds: props.subnets.map(s => s.subnetId)
        });

        const dataAccessEc2SecurityGroup = new ec2.SecurityGroup(this, 'database-access-security-group', {
            vpc: props.vpc,
            allowAllOutbound: true
        });
        dataAccessEc2SecurityGroup.addIngressRule(
            dataAccessEc2SecurityGroup,
            new ec2.Port({
                protocol: ec2.Protocol.ALL,
                stringRepresentation: 'rds-port'
            })
        );


        this.dbClusterParameterGroupName = parameterGroup.parameterGroupName;
        this.dbSubnetGroupName = subnetGroup.ref;
        this.vpcSecurityGroupIds = [dataAccessEc2SecurityGroup.securityGroupId];
        this.masterUserPassword = cdk.Fn.join('', ['{{resolve:secretsmanager:', masterPasswordSecret.secretArn, '}}']);

        this.securityGroup = dataAccessEc2SecurityGroup;
        this.masterPassword = masterPasswordSecret;
        this.masterUserName = props.masterUsername;

    }
}