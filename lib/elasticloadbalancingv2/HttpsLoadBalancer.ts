import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as lb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cdk from "@aws-cdk/core";
import * as route53 from '@aws-cdk/aws-route53';
import * as alias from '@aws-cdk/aws-route53-targets';

export class HttpsLoadBalancer extends lb.ApplicationLoadBalancer{
    private readonly httpslistener: lb.ApplicationListener;
    constructor(scope: cdk.Construct, id: string,
                vpc: ec2.IVpc,
                subnets: ec2.ISubnet[],
                certificateArn: string) {
        super(scope, id, { vpc: vpc, vpcSubnets: { subnets: subnets } });

        const loadBalancerAlias = new alias.LoadBalancerTarget(this);
        new route53.ARecord(this, 'tech-name', {
            recordName: 'pad.tl.cjpowered.com',
            ttl: cdk.Duration.minutes(5),
            zone: route53.HostedZone.fromLookup(this, 'tl-zone', {domainName: 'tl.cjpowered.com'}),
            target: route53.RecordTarget.fromAlias(loadBalancerAlias),
        });
        this.httpslistener = this.addListener('https-listener', {
            port: 443,
            certificates: [{ certificateArn: certificateArn }]
        });
    }

    public addTargets(
        targets: ecs.IEcsLoadBalancerTarget[]
    ){
        this.httpslistener.addTargets('targets', {
            port: 443,
            protocol: lb.ApplicationProtocol.HTTP,
            deregistrationDelay: cdk.Duration.seconds(15),
            slowStart: cdk.Duration.seconds(30),
            healthCheck: {
                healthyHttpCodes: "200",
                interval: cdk.Duration.seconds(61),
                timeout: cdk.Duration.seconds(60),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 5,
            },
            targets: targets,
        },);
    }
}