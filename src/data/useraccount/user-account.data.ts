import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import logger from "../../utils/logger";
import { STAUS } from "../../constants/application.constant";
import UserAccount from "../../models/userAccount.model";
import User from "../../models/userInput.model";

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

  async fetchUserAccounts(userDetails: User) {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "#userID = :userID",

      FilterExpression: "#account_status = :account_status",
      ExpressionAttributeNames: {
        "#userID": "userID",
        "#account_status": "account_status"
      },
      ExpressionAttributeValues: {
        ":account_status": STAUS.ACTIVE,
        ":userID": userDetails.userID
      }
    };

    const data = await this.docClient.query(params).promise();
    console.log(data);
    logger.info(data);
    if (!data || !data.Items.length) {
      logger.info("No data found");
      return null;
    }

    return data.Items;
  }
}

const userAccountData = new UserAccountData(
  createDynamoDBClient(),
  process.env.USER_ACCOUNT_TABLE
);
export default userAccountData;
