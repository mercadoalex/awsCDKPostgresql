import { Client } from 'pg';
import * as AWS from 'aws-sdk';
import * as response from 'cfn-response';

const secretsManager = new AWS.SecretsManager();

exports.handler = async (event: any, context: any) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const secretName = process.env.DB_SECRET_NAME;

  if (!secretName) {
    throw new Error('DB_SECRET_NAME environment variable is not set');
  }

  try {
    const secretValue = await secretsManager.getSecretValue({ SecretId: secretName }).promise();

    if (!secretValue.SecretString) {
      throw new Error('SecretString is empty');
    }

    const secret = JSON.parse(secretValue.SecretString);

    const client = new Client({
      host: process.env.DB_HOST,
      port: 5432,
      user: secret.username,
      password: secret.password,
      database: secret.dbname,
    });

    await client.connect();

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Employee (
        ID SERIAL PRIMARY KEY,
        FirstName VARCHAR(50),
        LastName VARCHAR(50),
        ZIP VARCHAR(10),
        Country VARCHAR(50),
        Salary INTEGER
      );
    `;

    const insertDataQuery = `
      INSERT INTO Employee (FirstName, LastName, ZIP, Country, Salary) VALUES
      ('John', 'Doe', '12345', 'USA', 50000),
      ('Jane', 'Smith', '54321', 'USA', 60000),
      ('Alice', 'Johnson', '67890', 'Canada', 70000);
    `;

    try {
      await client.query(createTableQuery);
      await client.query(insertDataQuery);
    } catch (error) {
      console.error('Error executing queries', error);
      throw new Error('Error executing queries');
    } finally {
      await client.end();
    }

    // Send success response to CloudFormation
    response.send(event, context, response.SUCCESS, {
      statusCode: 200,
      body: JSON.stringify('Database initialized successfully!'),
    });
  } catch (error) {
    console.error('Error:', error);

    // Send failure response to CloudFormation
    response.send(event, context, response.FAILED, {
      statusCode: 500,
      body: JSON.stringify('Error initializing database'),
    });
  }
};