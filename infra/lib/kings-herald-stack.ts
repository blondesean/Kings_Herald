import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const TOKEN_PARAMETER_NAME = '/kings-herald/discord-token';

export class KingsHeraldStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Public-only VPC with no NAT gateway. Fargate task gets a public IP for
    // outbound traffic to Discord; security group has no ingress rules.
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
      ],
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: 'kings-herald',
    });

    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ecs/kings-herald',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SecureString parameter is created out-of-band via `aws ssm put-parameter`.
    // CDK references it by name; the actual value never lives in source.
    const tokenParam = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'BotToken', {
      parameterName: TOKEN_PARAMETER_NAME,
    });

    // Persistent leaderboard for the weekly recap. Keyed (guildId, userId) so
    // multiple servers stay separate. On-demand billing is free-tier friendly at
    // this volume; RETAIN keeps the standings if the stack is ever destroyed.
    const pointsTable = new dynamodb.Table(this, 'PointsTable', {
      partitionKey: { name: 'guildId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Builds the bot image from the repo's Dockerfile at deploy time and uploads
    // it to a CDK-managed ECR repository.
    const image = new ecr_assets.DockerImageAsset(this, 'Image', {
      directory: path.join(__dirname, '..', '..'),
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    taskDefinition.addContainer('Bot', {
      image: ecs.ContainerImage.fromDockerImageAsset(image),
      environment: {
        POINTS_TABLE_NAME: pointsTable.tableName,
        AWS_REGION: this.region,
      },
      secrets: {
        DISCORD_BOT_TOKEN: ecs.Secret.fromSsmParameter(tokenParam),
      },
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'bot',
        logGroup,
      }),
    });

    // Let the task read and write the weekly-recap leaderboard.
    pointsTable.grantReadWriteData(taskDefinition.taskRole);

    new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      serviceName: 'kings-herald',
    });

    new cdk.CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
    new cdk.CfnOutput(this, 'LogGroupName', { value: logGroup.logGroupName });
    new cdk.CfnOutput(this, 'TokenParameterName', { value: TOKEN_PARAMETER_NAME });
    new cdk.CfnOutput(this, 'PointsTableName', { value: pointsTable.tableName });

    // GitHub Actions OIDC deploy role.
    // Skipped if no githubRepo context is set, so a fresh local clone can deploy
    // without depending on a GitHub repo identity.
    const githubRepo = this.node.tryGetContext('githubRepo') as string | undefined;
    if (githubRepo) {
      // Account-scoped: only one of these can exist per AWS account. If you
      // already have one from another project, swap this for:
      //   iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(this, 'GitHubOidc', existingArn)
      const githubOidc = new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
      });

      const deployRole = new iam.Role(this, 'GitHubDeployRole', {
        roleName: 'KingsHeraldGitHubDeploy',
        description: 'Assumed by GitHub Actions on push to master to run cdk deploy.',
        assumedBy: new iam.FederatedPrincipal(
          githubOidc.openIdConnectProviderArn,
          {
            StringEquals: {
              'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            },
            StringLike: {
              'token.actions.githubusercontent.com:sub': `repo:${githubRepo}:ref:refs/heads/master`,
            },
          },
          'sts:AssumeRoleWithWebIdentity'
        ),
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')],
        maxSessionDuration: cdk.Duration.hours(1),
      });

      new cdk.CfnOutput(this, 'GitHubDeployRoleArn', { value: deployRole.roleArn });
    }
  }
}
