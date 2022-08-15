import User from "../../models/userInput.model";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import logger from "../../utils/logger";

class UserData {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string
  ) {}

  async createUser(userDeatils: User) {
    logger.info("userData method in UserData", userDeatils);
    try {
      const initialParams = {
        TableName: this.tableName,
        Item: userDeatils
      };
      await this.docClient.put(initialParams).promise();
      logger.info("User data persisted successfuly");
      return userDeatils;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while persisting data to ${this.tableName}`
      );
    }
  }

  async getUsersByEmail(email: string) {
    logger.info("getUserByEmail method in UserData");
    try {
      const params = {
        TableName: this.tableName,
        FilterExpression: "#email= :email",
        ExpressionAttributeNames: {
          "#email": "email"
        },
        ExpressionAttributeValues: {
          ":email": email
        }
      };

      const data = await this.docClient.scan(params).promise();
      if (!data || !data.Items) {
        logger.info("No data found");
        return null;
      }
      return data.Items;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while persisting data to ${this.tableName}`
      );
    }
  }

  async getUsersByID(userID: string) {
    const params = {
      TableName: this.tableName,
      Key: {
        userID
      }
    };

    const data = await this.docClient.get(params).promise();
    logger.info(data);
    if (!data || !data.Item) {
      logger.info("No data found");
      return null;
    }

    return data.Item;
  }
}

const userData = new UserData(createDynamoDBClient(), process.env.USER_TABLE);
export default userData;
