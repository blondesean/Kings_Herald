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

export interface KingsHeraldStackProps extends cdk.StackProps {
  /**
   * Short environment name. Drives all resource names so prod and beta never
   * collide: 'kings-herald' for prod, 'kings-herald-beta' for beta.
   */
  readonly resourceName: string;

  /**
   * How many bot tasks to run. Prod runs 1 (always on). Beta runs 0 by default
   * (on-demand): the service exists but costs nothing until you scale it to 1
   * for a test, then back to 0.
   */
  readonly desiredCount: number;

  /**
   * What happens to the DynamoDB leaderboard if the stack is destroyed. Prod
   * RETAINs (never lose real standings); beta DESTROYs (throwaway data).
   */
  readonly tableRemovalPolicy: cdk.RemovalPolicy;

  /**
   * Whether this stack creates the account-scoped GitHub OIDC provider and the
   * shared deploy role. Only ONE stack per account may do this (prod). Beta
   * reuses the same role, so it passes false.
   */
  readonly createDeployRole: boolean;

  /**
   * owner/repo the deploy role trusts, and the default target for `!complain`.
   */
  readonly githubRepo?: string;
}

export class KingsHeraldStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: KingsHeraldStackProps) {
    super(scope, id, props);

    const { resourceName, desiredCount, tableRemovalPolicy, createDeployRole } = props;

    // SecureString parameters holding the secrets for THIS environment. Prod
    // reads /kings-herald/*, beta reads /kings-herald-beta/*, so the two bots
    // use different Discord applications and never answer for each other.
    const tokenParameterName = `/${resourceName}/discord-token`;
    const githubTokenParameterName = `/${resourceName}/github-token`;

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
      clusterName: resourceName,
    });

    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${resourceName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SecureString parameters are created out-of-band via `aws ssm put-parameter`.
    // CDK references them by name; the actual values never live in source.
    const tokenParam = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'BotToken', {
      parameterName: tokenParameterName,
    });

    // GitHub token for the !complain command (a fine-grained PAT scoped to
    // Issues:write). Seeded out-of-band like the Discord token; CDK only
    // references it by name.
    const githubTokenParam = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'GitHubToken', {
      parameterName: githubTokenParameterName,
    });

    // Persistent leaderboard for the weekly recap. Keyed (guildId, userId) so
    // multiple servers stay separate. On-demand billing is free-tier friendly at
    // this volume. Prod RETAINs the standings; beta is disposable.
    const pointsTable = new dynamodb.Table(this, 'PointsTable', {
      partitionKey: { name: 'guildId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: tableRemovalPolicy,
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
        GITHUB_REPO: props.githubRepo || 'blondesean/Kings_Herald',
      },
      secrets: {
        DISCORD_BOT_TOKEN: ecs.Secret.fromSsmParameter(tokenParam),
        GITHUB_TOKEN: ecs.Secret.fromSsmParameter(githubTokenParam),
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
      desiredCount,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      serviceName: resourceName,
      // Run on Fargate Spot (~70% cheaper). If AWS reclaims the task it gets a
      // 2-minute warning and is restarted; the bot just reconnects to the
      // Discord gateway, so a rare short blip is acceptable for this workload.
      capacityProviderStrategies: [
        { capacityProvider: 'FARGATE_SPOT', weight: 1 },
      ],
    });

    new cdk.CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
    new cdk.CfnOutput(this, 'ServiceName', { value: resourceName });
    new cdk.CfnOutput(this, 'LogGroupName', { value: logGroup.logGroupName });
    new cdk.CfnOutput(this, 'TokenParameterName', { value: tokenParameterName });
    new cdk.CfnOutput(this, 'GitHubTokenParameterName', { value: githubTokenParameterName });
    new cdk.CfnOutput(this, 'PointsTableName', { value: pointsTable.tableName });

    // GitHub Actions OIDC deploy role. Account-scoped, so only the prod stack
    // creates it; the beta stack is deployed by the same role.
    // Skipped entirely if no githubRepo is set, so a fresh local clone can
    // deploy without depending on a GitHub repo identity.
    const githubRepo = props.githubRepo;
    if (createDeployRole && githubRepo) {
      // Account-scoped: only one of these can exist per AWS account. If you
      // already have one from another project, swap this for:
      //   iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(this, 'GitHubOidc', existingArn)
      const githubOidc = new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
      });

      const deployRole = new iam.Role(this, 'GitHubDeployRole', {
        roleName: 'KingsHeraldGitHubDeploy',
        description: 'Assumed by GitHub Actions to run cdk deploy (master->prod, develop->beta).',
        assumedBy: new iam.FederatedPrincipal(
          githubOidc.openIdConnectProviderArn,
          {
            StringEquals: {
              'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            },
            // Allow the workflow to assume the role from either branch: master
            // deploys prod, develop deploys beta. Nothing else can assume it.
            StringLike: {
              'token.actions.githubusercontent.com:sub': [
                `repo:${githubRepo}:ref:refs/heads/master`,
                `repo:${githubRepo}:ref:refs/heads/develop`,
              ],
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
