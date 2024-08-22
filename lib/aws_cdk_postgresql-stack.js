"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsCdkPostgresqlStack = void 0;
const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const rds = require("@aws-cdk/aws-rds");
const lambda = require("@aws-cdk/aws-lambda");
const secretsmanager = require("@aws-cdk/aws-secretsmanager");
const path = require("path");
const dotenv = require("dotenv");
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
            credentials: rds.Credentials.fromSecret(secretsmanager.Secret.fromSecretNameV2(this, 'DbSecret', 'db_secret')),
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
exports.AwsCdkPostgresqlStack = AwsCdkPostgresqlStack;
const app = new cdk.App();
new AwsCdkPostgresqlStack(app, 'AwsCdkPostgresqlStack');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzX2Nka19wb3N0Z3Jlc3FsLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXdzX2Nka19wb3N0Z3Jlc3FsLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyx3Q0FBd0M7QUFDeEMsd0NBQXdDO0FBQ3hDLDhDQUE4QztBQUM5Qyw4REFBOEQ7QUFDOUQsNkJBQTZCO0FBQzdCLGlDQUFpQztBQUVqQyw0Q0FBNEM7QUFDNUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWhCLE1BQWEscUJBQXNCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDbEQsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUNsRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qix5REFBeUQ7UUFDekQsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLEVBQUUsQ0FBQztRQUNsRSxNQUFNLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLElBQUksRUFBRSxDQUFDO1FBRXBFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQ3pCLE1BQU0sSUFBSSxLQUFLLENBQUMsa0ZBQWtGLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBQ0QsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpRkFBaUYsQ0FBQyxDQUFDO1FBQ3JHLENBQUM7UUFFRCxlQUFlO1FBQ2YsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7WUFDbkMsTUFBTSxFQUFFLENBQUMsQ0FBQyxtQ0FBbUM7U0FDOUMsQ0FBQyxDQUFDO1FBRUgsK0NBQStDO1FBQy9DLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ2pFLEdBQUc7WUFDSCxXQUFXLEVBQUUsdUJBQXVCO1lBQ3BDLGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQyxDQUFDO1FBQ0gsYUFBYSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLHlCQUF5QixDQUFDLENBQUM7UUFFaEcsMEJBQTBCO1FBQzFCLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUNwRSxNQUFNLEVBQUUsR0FBRyxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQztnQkFDMUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsb0JBQW9CLENBQUM7YUFDakYsQ0FBQztZQUNGLFlBQVksRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUN2RixHQUFHO1lBQ0gsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQy9CLE9BQU8sRUFBRSxLQUFLO1lBQ2QsZ0JBQWdCLEVBQUUsRUFBRTtZQUNwQixXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHO1lBQ2hDLHFCQUFxQixFQUFFLENBQUMsWUFBWSxDQUFDO1lBQ3JDLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsWUFBWSxFQUFFLFlBQVk7WUFDMUIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM5RyxrQkFBa0IsRUFBRSxLQUFLO1NBQzFCLENBQUMsQ0FBQztRQUVILDZCQUE2QjtRQUM3QixNQUFNLGNBQWMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ2pFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLHVCQUF1QjtZQUNoQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0QsV0FBVyxFQUFFO2dCQUNYLE9BQU8sRUFBRSxVQUFVLENBQUMseUJBQXlCO2dCQUM3QyxjQUFjLEVBQUUsV0FBVzthQUM1QjtZQUNELEdBQUc7WUFDSCxjQUFjLEVBQUUsQ0FBQyxhQUFhLENBQUM7U0FDaEMsQ0FBQyxDQUFDO1FBRUgsOERBQThEO1FBQzlELFVBQVUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRTdDLGdFQUFnRTtRQUNoRSxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3BFLFlBQVksRUFBRSxjQUFjLENBQUMsV0FBVztTQUN6QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFuRUQsc0RBbUVDO0FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsSUFBSSxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsdUJBQXVCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdAYXdzLWNkay9hd3MtZWMyJztcbmltcG9ydCAqIGFzIHJkcyBmcm9tICdAYXdzLWNkay9hd3MtcmRzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIHNlY3JldHNtYW5hZ2VyIGZyb20gJ0Bhd3MtY2RrL2F3cy1zZWNyZXRzbWFuYWdlcic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZG90ZW52IGZyb20gJ2RvdGVudic7XG5cbi8vIExvYWQgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZyb20gLmVudiBmaWxlXG5kb3RlbnYuY29uZmlnKCk7XG5cbmV4cG9ydCBjbGFzcyBBd3NDZGtQb3N0Z3Jlc3FsU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gUmV0cmlldmUgUG9zdGdyZVNRTCB2ZXJzaW9uIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgY29uc3QgcG9zdGdyZXNGdWxsVmVyc2lvbiA9IHByb2Nlc3MuZW52LlBPU1RHUkVTRlVMTFZFUlNJT04gPz8gXCJcIjtcbiAgICBjb25zdCBwb3N0Z3Jlc01ham9yVmVyc2lvbiA9IHByb2Nlc3MuZW52LlBPU1RHUkVTTUFKT1JWRVJTSU9OID8/IFwiXCI7XG5cbiAgICBpZiAoIXBvc3RncmVzRnVsbFZlcnNpb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWUgbWlzc2luZyBmb3IgZW52aXJvbm1lbnQgdmFyaWFibGU6IFBPU1RHUkVTRlVMTFZFUlNJT04uIEZvciBleGFtcGxlLCBcIjE0LjJcIicpO1xuICAgIH1cbiAgICBpZiAoIXBvc3RncmVzTWFqb3JWZXJzaW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlIG1pc3NpbmcgZm9yIGVudmlyb25tZW50IHZhcmlhYmxlOiBQT1NUR1JFU01BSk9SVkVSU0lPTi4gRm9yIGV4YW1wbGUsIFwiMTRcIicpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhIFZQQ1xuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdWUEMnLCB7XG4gICAgICBtYXhBenM6IDIgLy8gRGVmYXVsdCBpcyBhbGwgQVpzIGluIHRoZSByZWdpb25cbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBhIHNlY3VyaXR5IGdyb3VwIGZvciB0aGUgUkRTIGluc3RhbmNlXG4gICAgY29uc3Qgc2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnU2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIHZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3cgcG9zdGdyZXMgYWNjZXNzJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWVcbiAgICB9KTtcbiAgICBzZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKGVjMi5QZWVyLmFueUlwdjQoKSwgZWMyLlBvcnQudGNwKDU0MzIpLCAnQWxsb3cgUG9zdGdyZVNRTCBhY2Nlc3MnKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgUkRTIGluc3RhbmNlXG4gICAgY29uc3QgZGJJbnN0YW5jZSA9IG5ldyByZHMuRGF0YWJhc2VJbnN0YW5jZSh0aGlzLCAnUG9zdGdyZXNJbnN0YW5jZScsIHtcbiAgICAgIGVuZ2luZTogcmRzLkRhdGFiYXNlSW5zdGFuY2VFbmdpbmUucG9zdGdyZXMoe1xuICAgICAgICB2ZXJzaW9uOiByZHMuUG9zdGdyZXNFbmdpbmVWZXJzaW9uLm9mKHBvc3RncmVzRnVsbFZlcnNpb24sIHBvc3RncmVzTWFqb3JWZXJzaW9uKVxuICAgICAgfSksXG4gICAgICBpbnN0YW5jZVR5cGU6IGVjMi5JbnN0YW5jZVR5cGUub2YoZWMyLkluc3RhbmNlQ2xhc3MuQlVSU1RBQkxFMywgZWMyLkluc3RhbmNlU2l6ZS5NSUNSTyksXG4gICAgICB2cGMsXG4gICAgICBzZWN1cml0eUdyb3VwczogW3NlY3VyaXR5R3JvdXBdLFxuICAgICAgbXVsdGlBejogZmFsc2UsXG4gICAgICBhbGxvY2F0ZWRTdG9yYWdlOiAyMCxcbiAgICAgIHN0b3JhZ2VUeXBlOiByZHMuU3RvcmFnZVR5cGUuR1AyLFxuICAgICAgY2xvdWR3YXRjaExvZ3NFeHBvcnRzOiBbJ3Bvc3RncmVzcWwnXSxcbiAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogZmFsc2UsXG4gICAgICBkYXRhYmFzZU5hbWU6ICdNeURhdGFiYXNlJyxcbiAgICAgIGNyZWRlbnRpYWxzOiByZHMuQ3JlZGVudGlhbHMuZnJvbVNlY3JldChzZWNyZXRzbWFuYWdlci5TZWNyZXQuZnJvbVNlY3JldE5hbWVWMih0aGlzLCAnRGJTZWNyZXQnLCAnZGJfc2VjcmV0JykpLFxuICAgICAgcHVibGljbHlBY2Nlc3NpYmxlOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBpbml0RGJGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0luaXREYkZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBoYW5kbGVyOiAnaW5pdGlhbGl6ZS1kYi5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGFtYmRhJykpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgREJfSE9TVDogZGJJbnN0YW5jZS5kYkluc3RhbmNlRW5kcG9pbnRBZGRyZXNzLFxuICAgICAgICBEQl9TRUNSRVRfTkFNRTogJ2RiX3NlY3JldCdcbiAgICAgIH0sXG4gICAgICB2cGMsXG4gICAgICBzZWN1cml0eUdyb3VwczogW3NlY3VyaXR5R3JvdXBdXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCB0aGUgTGFtYmRhIGZ1bmN0aW9uIGFjY2VzcyB0byB0aGUgUkRTIGluc3RhbmNlIHNlY3JldFxuICAgIGRiSW5zdGFuY2Uuc2VjcmV0Py5ncmFudFJlYWQoaW5pdERiRnVuY3Rpb24pO1xuXG4gICAgLy8gVHJpZ2dlciB0aGUgTGFtYmRhIGZ1bmN0aW9uIGFmdGVyIHRoZSBSRFMgaW5zdGFuY2UgaXMgY3JlYXRlZFxuICAgIGNvbnN0IGluaXREYlJlc291cmNlID0gbmV3IGNkay5DdXN0b21SZXNvdXJjZSh0aGlzLCAnSW5pdERiUmVzb3VyY2UnLCB7XG4gICAgICBzZXJ2aWNlVG9rZW46IGluaXREYkZ1bmN0aW9uLmZ1bmN0aW9uQXJuXG4gICAgfSk7XG4gIH1cbn1cblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbm5ldyBBd3NDZGtQb3N0Z3Jlc3FsU3RhY2soYXBwLCAnQXdzQ2RrUG9zdGdyZXNxbFN0YWNrJyk7Il19