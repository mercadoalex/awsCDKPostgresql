#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { AwsCdkPostgresqlStack } from '../lib/aws_cdk_postgresql-stack';


const app = new cdk.App();
new AwsCdkPostgresqlStack(app, 'AwsCdkPostgresqlStack');


