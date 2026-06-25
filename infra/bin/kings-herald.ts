#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { KingsHeraldStack } from '../lib/kings-herald-stack';

const app = new cdk.App();

new KingsHeraldStack(app, 'KingsHeraldStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Kings_Herald Discord bot — ECS Fargate task, ECR image, SSM-sourced secret, CloudWatch logs.',
});
