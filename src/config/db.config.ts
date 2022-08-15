import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ENV_CONSTANTS } from "../constants/env.constants";

const createDynamoDBClient = (): DocumentClient => {
  if (process.env.IS_OFFLINE) {
    return new AWS.DynamoDB.DocumentClient({
      region: "local",
      endpoint: ENV_CONSTANTS.LOCAL_DYNAMODB_ENDPOINT
      //   accessKeyId: ENV_CONSTANTS.LOCAL_ACCESS_KEY_ID,
      //   secretAccessKey: ENV_CONSTANTS.LOCAL_SECRET_KEY
    });
  }
  console.log("Dynamo Db Client created succeesfully");
  return new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
};

export default createDynamoDBClient;
