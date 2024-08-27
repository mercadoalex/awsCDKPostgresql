import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config();

export class AwsCdkPostgresqlStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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

    // Define the VPC
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 3 // Default is all AZs in the region
    });
    console.log('VPC created:', vpc.vpcId);

    // Define the Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
      vpc,
      description: 'Allow ssh access to ec2 instances',
      allowAllOutbound: true // Allow all outbound traffic by default
    });
    console.log('Security Group created:', securityGroup.securityGroupId);

    // Add ingress rule to allow SSH access
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow ssh access from the world');
    console.log('Ingress rule added to Security Group');

    // Retrieve database credentials from AWS Secrets Manager
    const dbSecret = secretsmanager.Secret.fromSecretNameV2(this, 'DBSecret', 'db_secret');

    // Create the RDS instance
    const dbInstance = new rds.DatabaseInstance(this, 'PostgresInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.of(postgresFullVersion, postgresMajorVersion)
      }),
      vpc,
      securityGroups: [securityGroup],
      credentials: rds.Credentials.fromSecret(dbSecret),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO), // Updated instance type
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP2,
      multiAz: false,
      publiclyAccessible: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });
    console.log('RDS instance created:', dbInstance.instanceIdentifier);

    // Define the Lambda function
    const initializeDbLambda = new lambda.Function(this, 'InitializeDbLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'initialize-db.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lib')),
      environment: {
        DB_SECRET_NAME: 'db_secret'
      },
      vpc,
      securityGroups: [securityGroup]
    });

    // Grant the Lambda function permissions to access the Secrets Manager and RDS
    dbSecret.grantRead(initializeDbLambda);
    dbInstance.grantConnect(initializeDbLambda);
    initializeDbLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['rds:*'],
      resources: [dbInstance.instanceArn]
    }));
  }
}