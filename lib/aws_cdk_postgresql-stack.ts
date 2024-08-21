import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as lambda from '@aws-cdk/aws-lambda';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export class AwsCdkPostgresqlStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Retrieve PostgreSQL version from environment variables
    const postgresFullVersion = process.env.POSTGRESFULLVERSION ?? "";
    const postgresMajorVersion = process.env.POSTGRESMAJORVERSION ?? "";

    if (!postgresFullVersion) {
      throw new Error('Value missing for environment variable: POSTGRESFULLVERSION. For example, "14.2"');
    }
    if (!postgresMajorVersion) {
      throw new Error('Value missing for environment variable: POSTGRESMAJORVERSION. For example, "14"');
    }

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2 // Default is all AZs in the region
    });

    // Create a security group for the RDS instance
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow postgres access',
      allowAllOutbound: true
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432), 'Allow PostgreSQL access');

    // Create the RDS instance
    const dbInstance = new rds.DatabaseInstance(this, 'PostgresInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.of(postgresFullVersion, postgresMajorVersion)
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      vpc,
      securityGroups: [securityGroup],
      multiAz: false,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      cloudwatchLogsExports: ['postgresql'],
      deletionProtection: false,
      databaseName: 'MyDatabase',
      credentials: rds.Credentials.fromSecret(secretsmanager.Secret.fromSecretNameV2(this, 'DbSecret', 'db_secret')), // Use the secret from Secrets Manager
      publiclyAccessible: false
    });

    // Create the Lambda function
    const initDbFunction = new lambda.Function(this, 'InitDbFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'initialize-db.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        DB_HOST: dbInstance.dbInstanceEndpointAddress,
        DB_SECRET_NAME: 'db_secret'
      },
      vpc,
      securityGroups: [securityGroup]
    });

    // Grant the Lambda function access to the RDS instance secret
    dbInstance.secret?.grantRead(initDbFunction);

    // Trigger the Lambda function after the RDS instance is created
    const initDbResource = new cdk.CustomResource(this, 'InitDbResource', {
      serviceToken: initDbFunction.functionArn
    });
  }
}

const app = new cdk.App();
new AwsCdkPostgresqlStack(app, 'AwsCdkPostgresqlStack');