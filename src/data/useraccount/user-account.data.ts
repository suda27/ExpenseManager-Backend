import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import logger from "../../utils/logger";
import { STAUS } from "../../constants/application.constant";
import UserAccount from "../../models/userAccount.model";

class UserAccountData {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string
  ) {}

  async createUserAccount(userAccountDeatils: UserAccount) {
    logger.info("createUser method in UserData", userAccountDeatils);
    try {
      const initialParams = {
        TableName: this.tableName,
        Item: userAccountDeatils
      };
      await this.docClient.put(initialParams).promise();
      logger.info("User Account data persisted successfuly");
      return userAccountDeatils;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while persisting data to ${this.tableName}`
      );
    }
  }
}

const userAccountData = new UserAccountData(
  createDynamoDBClient(),
  process.env.USER_ACCOUNT_TABLE
);
export default userAccountData;
