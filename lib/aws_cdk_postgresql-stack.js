"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsCdkPostgresqlStack = void 0;
const cdk = require("aws-cdk-lib");
const rds = require("aws-cdk-lib/aws-rds");
const lambda = require("aws-cdk-lib/aws-lambda");
const secretsmanager = require("aws-cdk-lib/aws-secretsmanager");
const ec2 = require("aws-cdk-lib/aws-ec2");
const iam = require("aws-cdk-lib/aws-iam");
const dotenv = require("dotenv");
const path = require("path");
// Load environment variables from .env file
dotenv.config();
class AwsCdkPostgresqlStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
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
exports.AwsCdkPostgresqlStack = AwsCdkPostgresqlStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzX2Nka19wb3N0Z3Jlc3FsLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXdzX2Nka19wb3N0Z3Jlc3FsLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQywyQ0FBMkM7QUFDM0MsaURBQWlEO0FBQ2pELGlFQUFpRTtBQUNqRSwyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBQzNDLGlDQUFpQztBQUNqQyw2QkFBNkI7QUFFN0IsNENBQTRDO0FBQzVDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUVoQixNQUFhLHFCQUFzQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ2xELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIseURBQXlEO1FBQ3pELE1BQU0sbUJBQW1CLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxFQUFFLENBQUM7UUFDbEUsTUFBTSxvQkFBb0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixJQUFJLEVBQUUsQ0FBQztRQUVwRSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxrRkFBa0YsQ0FBQyxDQUFDO1NBQ3JHO1FBQ0QsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQ3pCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUZBQWlGLENBQUMsQ0FBQztTQUNwRztRQUVELGlCQUFpQjtRQUNqQixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUNyQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLG1DQUFtQztTQUM5QyxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFdkMsNEJB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T0FBTyxDQUFDO1lBQ2xCLFNBQVMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7U0FDcEMsQ0FBQyxDQUFDLENBQUM7SUFDTixDQUFDO0NBQ0Y7QUE5RUQsc0RBOEVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgcmRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yZHMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNlY3JldHNtYW5hZ2VyJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGRvdGVudiBmcm9tICdkb3RlbnYnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZnJvbSAuZW52IGZpbGVcbmRvdGVudi5jb25maWcoKTtcblxuZXhwb3J0IGNsYXNzIEF3c0Nka1Bvc3RncmVzcWxTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFJldHJpZXZlIFBvc3RncmVTUUwgdmVyc2lvbiBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgIGNvbnN0IHBvc3RncmVzRnVsbFZlcnNpb24gPSBwcm9jZXNzLmVudi5QT1NUR1JFU0ZVTExWRVJTSU9OID8/IFwiXCI7XG4gICAgY29uc3QgcG9zdGdyZXNNYWpvclZlcnNpb24gPSBwcm9jZXNzLmVudi5QT1NUR1JFU01BSk9SVkVSU0lPTiA/PyBcIlwiO1xuXG4gICAgaWYgKCFwb3N0Z3Jlc0Z1bGxWZXJzaW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlIG1pc3NpbmcgZm9yIGVudmlyb25tZW50IHZhcmlhYmxlOiBQT1NUR1JFU0ZVTExWRVJTSU9OLiBGb3IgZXhhbXBsZSwgXCIxNC4yXCInKTtcbiAgICB9XG4gICAgaWYgKCFwb3N0Z3Jlc01ham9yVmVyc2lvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZSBtaXNzaW5nIGZvciBlbnZpcm9ubWVudCB2YXJpYWJsZTogUE9TVEdSRVNNQUpPUlZFUlNJT04uIEZvciBleGFtcGxlLCBcIjE0XCInKTtcbiAgICB9XG5cbiAgICAvLyBEZWZpbmUgdGhlIFZQQ1xuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdNeVZwYycsIHtcbiAgICAgIG1heEF6czogMyAvLyBEZWZhdWx0IGlzIGFsbCBBWnMgaW4gdGhlIHJlZ2lvblxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCdWUEMgY3JlYXRlZDonLCB2cGMudnBjSWQpO1xuXG4gICAgLy8gRGVmaW5lIHRoZSBTZWN1cml0eSBHcm91cFxuICAgIGNvbnN0IHNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ015U2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIHZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3cgc3NoIGFjY2VzcyB0byBlYzIgaW5zdGFuY2VzJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUgLy8gQWxsb3cgYWxsIG91dGJvdW5kIHRyYWZmaWMgYnkgZGVmYXVsdFxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCdTZWN1cml0eSBHcm91cCBjcmVhdGVkOicsIHNlY3VyaXR5R3JvdXAuc2VjdXJpdHlHcm91cElkKTtcblxuICAgIC8vIEFkZCBpbmdyZXNzIHJ1bGUgdG8gYWxsb3cgU1NIIGFjY2Vzc1xuICAgIHNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoZWMyLlBlZXIuYW55SXB2NCgpLCBlYzIuUG9ydC50Y3AoMjIpLCAnYWxsb3cgc3NoIGFjY2VzcyBmcm9tIHRoZSB3b3JsZCcpO1xuICAgIGNvbnNvbGUubG9nKCdJbmdyZXNzIHJ1bGUgYWRkZWQgdG8gU2VjdXJpdHkgR3JvdXAnKTtcblxuICAgIC8vIFJldHJpZXZlIGRhdGFiYXNlIGNyZWRlbnRpYWxzIGZyb20gQVdTIFNlY3JldHMgTWFuYWdlclxuICAgIGNvbnN0IGRiU2VjcmV0ID0gc2VjcmV0c21hbmFnZXIuU2VjcmV0LmZyb21TZWNyZXROYW1lVjIodGhpcywgJ0RCU2VjcmV0JywgJ2RiX3NlY3JldCcpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBSRFMgaW5zdGFuY2VcbiAgICBjb25zdCBkYkluc3RhbmNlID0gbmV3IHJkcy5EYXRhYmFzZUluc3RhbmNlKHRoaXMsICdQb3N0Z3Jlc0luc3RhbmNlJywge1xuICAgICAgZW5naW5lOiByZHMuRGF0YWJhc2VJbnN0YW5jZUVuZ2luZS5wb3N0Z3Jlcyh7XG4gICAgICAgIHZlcnNpb246IHJkcy5Qb3N0Z3Jlc0VuZ2luZVZlcnNpb24ub2YocG9zdGdyZXNGdWxsVmVyc2lvbiwgcG9zdGdyZXNNYWpvclZlcnNpb24pXG4gICAgICB9KSxcbiAgICAgIHZwYyxcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbc2VjdXJpdHlHcm91cF0sXG4gICAgICBjcmVkZW50aWFsczogcmRzLkNyZWRlbnRpYWxzLmZyb21TZWNyZXQoZGJTZWNyZXQpLFxuICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLkJVUlNUQUJMRTMsIGVjMi5JbnN0YW5jZVNpemUuTUlDUk8pLCAvLyBVcGRhdGVkIGluc3RhbmNlIHR5cGVcbiAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IDIwLFxuICAgICAgbWF4QWxsb2NhdGVkU3RvcmFnZTogMTAwLFxuICAgICAgc3RvcmFnZVR5cGU6IHJkcy5TdG9yYWdlVHlwZS5HUDIsXG4gICAgICBtdWx0aUF6OiBmYWxzZSxcbiAgICAgIHB1YmxpY2x5QWNjZXNzaWJsZTogZmFsc2UsXG4gICAgICBhdXRvTWlub3JWZXJzaW9uVXBncmFkZTogdHJ1ZSxcbiAgICAgIGJhY2t1cFJldGVudGlvbjogY2RrLkR1cmF0aW9uLmRheXMoNyksXG4gICAgICBkZWxldGVBdXRvbWF0ZWRCYWNrdXBzOiB0cnVlLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogZmFsc2UsXG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJ1JEUyBpbnN0YW5jZSBjcmVhdGVkOicsIGRiSW5zdGFuY2UuaW5zdGFuY2VJZGVudGlmaWVyKTtcblxuICAgIC8vIERlZmluZSB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgaW5pdGlhbGl6ZURiTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSW5pdGlhbGl6ZURiTGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnaW5pdGlhbGl6ZS1kYi5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGliJykpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgREJfU0VDUkVUX05BTUU6ICdkYl9zZWNyZXQnXG4gICAgICB9LFxuICAgICAgdnBjLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IFtzZWN1cml0eUdyb3VwXVxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgdGhlIExhbWJkYSBmdW5jdGlvbiBwZXJtaXNzaW9ucyB0byBhY2Nlc3MgdGhlIFNlY3JldHMgTWFuYWdlciBhbmQgUkRTXG4gICAgZGJTZWNyZXQuZ3JhbnRSZWFkKGluaXRpYWxpemVEYkxhbWJkYSk7XG4gICAgZGJJbnN0YW5jZS5ncmFudENvbm5lY3QoaW5pdGlhbGl6ZURiTGFtYmRhKTtcbiAgICBpbml0aWFsaXplRGJMYW1iZGEuYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGFjdGlvbnM6IFsncmRzOionXSxcbiAgICAgIHJlc291cmNlczogW2RiSW5zdGFuY2UuaW5zdGFuY2VBcm5dXG4gICAgfSkpO1xuICB9XG59Il19