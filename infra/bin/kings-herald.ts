#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { KingsHeraldStack } from '../lib/kings-herald-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// Pinned in cdk.json; also used for the deploy role's trust policy.
const githubRepo = app.node.tryGetContext('githubRepo') as string | undefined;

// Production: always-on bot for the real servers. Reads /kings-herald/* secrets.
// This stack also owns the account-scoped GitHub OIDC provider + deploy role.
new KingsHeraldStack(app, 'KingsHeraldStack', {
  env,
  description: 'Kings_Herald Discord bot (prod) — ECS Fargate task, ECR image, SSM-sourced secret, CloudWatch logs.',
  resourceName: 'kings-herald',
  desiredCount: 1,
  tableRemovalPolicy: cdk.RemovalPolicy.RETAIN,
  createDeployRole: true,
  githubRepo,
});

// Beta: on-demand staging bot (separate Discord app, /kings-herald-beta/* secrets).
// desiredCount 0 means it costs nothing at rest; scale to 1 to run a test, then
// back to 0. Deployed automatically from the `develop` branch.
new KingsHeraldStack(app, 'KingsHeraldStack-Beta', {
  env,
  description: 'Kings_Herald Discord bot (beta) — on-demand staging stack, scaled to 0 by default.',
  resourceName: 'kings-herald-beta',
  desiredCount: 0,
  tableRemovalPolicy: cdk.RemovalPolicy.DESTROY,
  createDeployRole: false,
  githubRepo,
});
