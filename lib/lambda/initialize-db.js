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
            allowAllOutbound: true // Can be set to false
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
            // Other properties for the RDS instance
        });
        console.log('RDS instance created:', dbInstance.instanceIdentifier);
        // Define the Lambda function
        const initializeDbLambda = new lambda.Function(this, 'InitializeDbLambda', {
            runtime: lambda.Runtime.NODEJS_14_X,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdGlhbGl6ZS1kYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluaXRpYWxpemUtZGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBRW5DLDJDQUEyQztBQUMzQyxpREFBaUQ7QUFDakQsaUVBQWlFO0FBQ2pFLDJDQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsaUNBQWlDO0FBQ2pDLDZCQUE2QjtBQUU3Qiw0Q0FBNEM7QUFDNUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWhCLE1BQWEscUJBQXNCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDbEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qix5REFBeUQ7UUFDekQsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLEVBQUUsQ0FBQztRQUNsRSxNQUFNLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLElBQUksRUFBRSxDQUFDO1FBRXBFLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLGtGQUFrRixDQUFDLENBQUM7U0FDckc7UUFDRCxJQUFJLENBQUMsb0JBQW9CLEVBQUU7WUFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpRkFBaUYsQ0FBQyxDQUFDO1NBQ3BHO1FBRUQsaUJBQWlCO1FBQ2pCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO1lBQ3JDLE1BQU0sRUFBRSxDQUFDLENBQUMsbUNBQW1DO1NBQzlDLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV2Qyw0QkFBNEI7UUFDNUIsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNuRSxHQUFHO1lBQ0gsV0FBVyxFQUFFLG1DQUFtQztZQUNoRCxnQkFBZ0IsRUFBRSxJQUFJLENBQUcsc0JBQXNCO1NBQ2hELENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRXRFLHVDQUF1QztRQUN2QyxhQUFhLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztRQUN0RyxPQUFPLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7UUFFcEQseURBQXlEO1FBQ3pELE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUV2RiwwQkFBMEI7UUFDMUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQ3BFLE1BQU0sRUFBRSxHQUFHLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDO2dCQUMxQyxPQUFPLEVBQUUsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQzthQUNqRixDQUFDO1lBQ0YsR0FBRztZQUNILGNBQWMsRUFBRSxDQUFDLGFBQWEsQ0FBQztZQUMvQixXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1lBQ2pELHdDQUF3QztTQUN6QyxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBRXBFLDZCQUE2QjtRQUM3QixNQUFNLGtCQUFrQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDekUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsdUJBQXVCO1lBQ2hDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzRCxXQUFXLEVBQUU7Z0JBQ1gsY0FBYyxFQUFFLFdBQVc7YUFDNUI7WUFDRCxHQUFHO1lBQ0gsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO1NBQ2hDLENBQUMsQ0FBQztRQUVILDhFQUE4RTtRQUM5RSxRQUFRLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDdkMsVUFBVSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzVDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDekQsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDO1lBQ2xCLFNBQVMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7U0FDcEMsQ0FBQyxDQUFDLENBQUM7SUFDTixDQUFDO0NBQ0Y7QUFwRUQsc0RBb0VDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgcmRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yZHMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNlY3JldHNtYW5hZ2VyJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGRvdGVudiBmcm9tICdkb3RlbnYnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZnJvbSAuZW52IGZpbGVcbmRvdGVudi5jb25maWcoKTtcblxuZXhwb3J0IGNsYXNzIEF3c0Nka1Bvc3RncmVzcWxTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFJldHJpZXZlIFBvc3RncmVTUUwgdmVyc2lvbiBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgIGNvbnN0IHBvc3RncmVzRnVsbFZlcnNpb24gPSBwcm9jZXNzLmVudi5QT1NUR1JFU0ZVTExWRVJTSU9OID8/IFwiXCI7XG4gICAgY29uc3QgcG9zdGdyZXNNYWpvclZlcnNpb24gPSBwcm9jZXNzLmVudi5QT1NUR1JFU01BSk9SVkVSU0lPTiA/PyBcIlwiO1xuXG4gICAgaWYgKCFwb3N0Z3Jlc0Z1bGxWZXJzaW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlIG1pc3NpbmcgZm9yIGVudmlyb25tZW50IHZhcmlhYmxlOiBQT1NUR1JFU0ZVTExWRVJTSU9OLiBGb3IgZXhhbXBsZSwgXCIxNC4yXCInKTtcbiAgICB9XG4gICAgaWYgKCFwb3N0Z3Jlc01ham9yVmVyc2lvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZSBtaXNzaW5nIGZvciBlbnZpcm9ubWVudCB2YXJpYWJsZTogUE9TVEdSRVNNQUpPUlZFUlNJT04uIEZvciBleGFtcGxlLCBcIjE0XCInKTtcbiAgICB9XG5cbiAgICAvLyBEZWZpbmUgdGhlIFZQQ1xuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdNeVZwYycsIHtcbiAgICAgIG1heEF6czogMyAvLyBEZWZhdWx0IGlzIGFsbCBBWnMgaW4gdGhlIHJlZ2lvblxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCdWUEMgY3JlYXRlZDonLCB2cGMudnBjSWQpO1xuXG4gICAgLy8gRGVmaW5lIHRoZSBTZWN1cml0eSBHcm91cFxuICAgIGNvbnN0IHNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ015U2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIHZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3cgc3NoIGFjY2VzcyB0byBlYzIgaW5zdGFuY2VzJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUgICAvLyBDYW4gYmUgc2V0IHRvIGZhbHNlXG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJ1NlY3VyaXR5IEdyb3VwIGNyZWF0ZWQ6Jywgc2VjdXJpdHlHcm91cC5zZWN1cml0eUdyb3VwSWQpO1xuXG4gICAgLy8gQWRkIGluZ3Jlc3MgcnVsZSB0byBhbGxvdyBTU0ggYWNjZXNzXG4gICAgc2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShlYzIuUGVlci5hbnlJcHY0KCksIGVjMi5Qb3J0LnRjcCgyMiksICdhbGxvdyBzc2ggYWNjZXNzIGZyb20gdGhlIHdvcmxkJyk7XG4gICAgY29uc29sZS5sb2coJ0luZ3Jlc3MgcnVsZSBhZGRlZCB0byBTZWN1cml0eSBHcm91cCcpO1xuXG4gICAgLy8gUmV0cmlldmUgZGF0YWJhc2UgY3JlZGVudGlhbHMgZnJvbSBBV1MgU2VjcmV0cyBNYW5hZ2VyXG4gICAgY29uc3QgZGJTZWNyZXQgPSBzZWNyZXRzbWFuYWdlci5TZWNyZXQuZnJvbVNlY3JldE5hbWVWMih0aGlzLCAnREJTZWNyZXQnLCAnZGJfc2VjcmV0Jyk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIFJEUyBpbnN0YW5jZVxuICAgIGNvbnN0IGRiSW5zdGFuY2UgPSBuZXcgcmRzLkRhdGFiYXNlSW5zdGFuY2UodGhpcywgJ1Bvc3RncmVzSW5zdGFuY2UnLCB7XG4gICAgICBlbmdpbmU6IHJkcy5EYXRhYmFzZUluc3RhbmNlRW5naW5lLnBvc3RncmVzKHtcbiAgICAgICAgdmVyc2lvbjogcmRzLlBvc3RncmVzRW5naW5lVmVyc2lvbi5vZihwb3N0Z3Jlc0Z1bGxWZXJzaW9uLCBwb3N0Z3Jlc01ham9yVmVyc2lvbilcbiAgICAgIH0pLFxuICAgICAgdnBjLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IFtzZWN1cml0eUdyb3VwXSxcbiAgICAgIGNyZWRlbnRpYWxzOiByZHMuQ3JlZGVudGlhbHMuZnJvbVNlY3JldChkYlNlY3JldCksXG4gICAgICAvLyBPdGhlciBwcm9wZXJ0aWVzIGZvciB0aGUgUkRTIGluc3RhbmNlXG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJ1JEUyBpbnN0YW5jZSBjcmVhdGVkOicsIGRiSW5zdGFuY2UuaW5zdGFuY2VJZGVudGlmaWVyKTtcblxuICAgIC8vIERlZmluZSB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgaW5pdGlhbGl6ZURiTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSW5pdGlhbGl6ZURiTGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICBoYW5kbGVyOiAnaW5pdGlhbGl6ZS1kYi5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGliJykpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgREJfU0VDUkVUX05BTUU6ICdkYl9zZWNyZXQnXG4gICAgICB9LFxuICAgICAgdnBjLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IFtzZWN1cml0eUdyb3VwXVxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgdGhlIExhbWJkYSBmdW5jdGlvbiBwZXJtaXNzaW9ucyB0byBhY2Nlc3MgdGhlIFNlY3JldHMgTWFuYWdlciBhbmQgUkRTXG4gICAgZGJTZWNyZXQuZ3JhbnRSZWFkKGluaXRpYWxpemVEYkxhbWJkYSk7XG4gICAgZGJJbnN0YW5jZS5ncmFudENvbm5lY3QoaW5pdGlhbGl6ZURiTGFtYmRhKTtcbiAgICBpbml0aWFsaXplRGJMYW1iZGEuYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGFjdGlvbnM6IFsncmRzOionXSxcbiAgICAgIHJlc291cmNlczogW2RiSW5zdGFuY2UuaW5zdGFuY2VBcm5dXG4gICAgfSkpO1xuICB9XG59Il19