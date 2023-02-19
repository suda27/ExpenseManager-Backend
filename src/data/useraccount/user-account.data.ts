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
  ) { }

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

  async updateSingleUserAccount(userAccountDeatils: UserAccount) {
    logger.info(
      "updateSingleUserAccount method in UserData",
      userAccountDeatils
    );
    try {
      const initialParams: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: this.tableName,
        ConditionExpression: "attribute_exists(accountID)",
        Key: {
          accountID: userAccountDeatils.accountID,
          userId:userAccountDeatils.userId
        },
        UpdateExpression: `SET
          #account_description = :account_description,
          #account_group = :account_group,
          #account_updated_date = :account_updated_date,
          #account_amount = :account_amount,
          #account_status = :account_status,
          #account_name = :account_name
          `,
        ExpressionAttributeNames: {
          "#account_description": "account_description",
          "#account_group": "account_group",
          "#account_updated_date": "account_updated_date",
          "#account_amount": "account_amount",
          "#account_status": "account_status",
          "#account_name": "account_name"
        },
        ExpressionAttributeValues: {
          ":account_description": userAccountDeatils.account_description,
          ":account_group": userAccountDeatils.account_group,
          ":account_updated_date": new Date().toISOString(),
          ":account_amount": userAccountDeatils.account_amount,
          ":account_status": userAccountDeatils.account_status,
          ":account_name": userAccountDeatils.account_name
        }
      };

      console.log(initialParams);
      await this.docClient
        .update(initialParams, function (err, data) {
          if (err) {
            console.log(err);
          }
        })
        .promise();
      logger.info("User Account data persisted successfully");
      return userAccountDeatils;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while persisting data to ${this.tableName}`
      );
    }
  }

  async fetchSingleUserAccount(accountID: string) {
    const params = {
      TableName: this.tableName,
      FilterExpression: "#account_status = :account_status and #accountID = :accountID",
      ExpressionAttributeNames: {
        "#accountID": "accountID",
        "#account_status": "account_status"
      },
      ExpressionAttributeValues: {
        ":account_status": STAUS.ACTIVE,
        ":accountID": accountID
      }
    };

    console.log(params);

    const data = await this.docClient.scan(params).promise();
    console.log(data);
    logger.info(data);
    if (!data || !data.Items.length) {
      logger.info("No data found");
      return null;
    }
    // Test User Account Class type
    const fetchedUserSingleAccount = UserAccount.fromItem(data.Items[0]);

    return fetchedUserSingleAccount;
  }

  async fetchUserAccounts(userDetails: User) {
    const params = {
      TableName: this.tableName,
      FilterExpression:
        "#account_status = :account_status and #userId =:userId",
      ExpressionAttributeNames: {
        "#userId": "userId",
        "#account_status": "account_status"
      },
      ExpressionAttributeValues: {
        ":account_status": STAUS.ACTIVE,
        ":userId": userDetails.userId
      }
    };

    const data = await this.docClient
      .scan(params, function (err, data) {
        if (err) {
          logger.error(err);
        }
      })
      .promise();
    if (!data || !data.Items.length) {
      logger.info("No data found");
      return null;
    }
    const fetchedUserAllAccounts = data.Items.map(item => {
      return UserAccount.fromItem(item);
    });

    return fetchedUserAllAccounts;
  }
}

const userAccountData = new UserAccountData(
  createDynamoDBClient(),
  process.env.USER_ACCOUNT_TABLE
);
export default userAccountData;
