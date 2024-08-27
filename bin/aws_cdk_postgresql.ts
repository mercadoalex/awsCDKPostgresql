#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsCdkPostgresqlStack } from '../lib/aws_cdk_postgresql-stack';

// Initialize the CDK application
const app = new cdk.App();

// Instantiate the stack
new AwsCdkPostgresqlStack(app, 'AwsCdkPostgresqlStack', {
  env: { region: 'us-east-1' }
});

