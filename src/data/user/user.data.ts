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
    console.log("userData method in UserData", userDeatils);
    try {
      const initialParams = {
        TableName: this.tableName,
        Item: userDeatils
      };
      await this.docClient.put(initialParams).promise();
      logger.info("User data persisted successfuly");
      console.log("User data persisted successfuly");
      return userDeatils;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while persisting data to ${this.tableName}`
      );
    }
  }
}

const userData = new UserData(createDynamoDBClient(), process.env.USER_TABLE);
export default userData;
