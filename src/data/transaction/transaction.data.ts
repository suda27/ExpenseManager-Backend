import User from "../../models/userInput.model";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import logger from "../../utils/logger";
import { STAUS } from "../../constants/application.constant";
import UserTransaction from "../../models/userTransaction.model";

class TransactionData {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string
  ) {}

  async addExpenseTransaction(userTransaction: UserTransaction) {
    logger.info("addExpenseTransaction method in TransactionData");
    try {
      const initialParams = {
        TableName: this.tableName,
        Item: userTransaction
      };
      await this.docClient
        .put(initialParams, function(err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log(data);
          }
        })
        .promise();
      logger.info("User transaction data persisted successfuly");
      return userTransaction;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while persisting data to ${this.tableName}`
      );
    }
  }
}

const transactionData = new TransactionData(
  createDynamoDBClient(),
  process.env.USER_TRANSACTION_TABLE
);
export default transactionData;
