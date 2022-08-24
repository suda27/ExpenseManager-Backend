import User from "../../models/userInput.model";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import logger from "../../utils/logger";
import { STAUS } from "../../constants/application.constant";
import UserTransaction from "../../models/userTransaction.model";
import UserAccount from "../../models/userAccount.model";

class TransactionData {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string
  ) {}

  async addTransaction(userTransaction: UserTransaction) {
    logger.info("addTransaction method in TransactionData");
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

  async fetchAllTransactionOfUser(userDetails: User) {
    logger.info("fetchAllTransactionOfUser method in TransactionData");
    try {
      const initialParams = {
        TableName: this.tableName,
        FilterExpression:
          "#transaction_status = :transaction_status and #userID =:userID",
        ExpressionAttributeNames: {
          "#userID": "userID",
          "#transaction_status": "transaction_status"
        },
        ExpressionAttributeValues: {
          ":transaction_status": STAUS.ACTIVE,
          ":userID": userDetails.userID
        }
      };
      const data = await this.docClient
        .scan(initialParams, function(err, data) {
          if (err) {
            logger.error(err);
          }
        })
        .promise();
      if (!data || !data.Items.length) {
        logger.info("No data found");
        return null;
      }
      const fetchedUserAllTransaction = data.Items.map(item => {
        return UserTransaction.fromItem(item);
      });

      return fetchedUserAllTransaction;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while persisting data to ${this.tableName}`
      );
    }
  }

  async fetchAllTransactionOfAccount(userAccountDetails: UserAccount) {
    logger.info("fetchAllTransactionOfAccount method in TransactionData");
    try {
      const initialParams = {
        TableName: this.tableName,
        FilterExpression:
          "#transaction_status = :transaction_status and ( #source_account_id =:source_account_id or #destination_account_id =:destination_account_id )",
        ExpressionAttributeNames: {
          "#source_account_id": "source_account_id",
          "#transaction_status": "transaction_status",
          "#destination_account_id": "destination_account_id"
        },
        ExpressionAttributeValues: {
          ":transaction_status": STAUS.ACTIVE,
          ":source_account_id": userAccountDetails.accountID,
          ":destination_account_id": userAccountDetails.accountID
        }
      };
      const data = await this.docClient
        .scan(initialParams, function(err, data) {
          if (err) {
            console.error(err);
          }
        })
        .promise();
      if (!data || !data.Items.length) {
        logger.info("No data found");
        return null;
      }

      const fetchedUserAllTransaction = data.Items.map(item => {
        return UserTransaction.fromItem(item);
      });

      return fetchedUserAllTransaction;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while persisting data to ${this.tableName}`
      );
    }
  }

  async fetchSingleTransaction(userTransaction: UserTransaction) {
    logger.info("fetchSingleTransaction method in TransactionData");
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "#transactionID = :transactionID",
      FilterExpression: "#transaction_status = :transaction_status",
      ExpressionAttributeNames: {
        "#transactionID": "transactionID",
        "#transaction_status": "transaction_status"
      },
      ExpressionAttributeValues: {
        ":transaction_status": STAUS.ACTIVE,
        ":transactionID": userTransaction.transactionID
      }
    };
    console.log(params);
    const data = await this.docClient
      .query(params, (err, data) => {
        if (err) console.log(err);
        else console.log(data);
      })
      .promise();
    logger.info(data);
    if (!data || !data.Items.length) {
      logger.info("No data found");
      return null;
    }

    const transactionDetails = UserTransaction.fromItem(data.Items[0]);
    return transactionDetails;
  }

  async updateUserTransactionForSameTransactionType(
    userTransaction: UserTransaction
  ) {
    logger.info("updateUserTransaction method in TransactionData");
    try {
      const initialParams: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: this.tableName,
        ConditionExpression: "attribute_exists(transactionID)",
        Key: {
          transactionID: userTransaction.transactionID
        },
        UpdateExpression: `SET
              #source_account_id = :source_account_id,
              #source_account_name = :source_account_name,
              #destination_account_id = :destination_account_id,
              #destination_account_name = :destination_account_name,
              #transaction_type = :transaction_type,
              #transaction_amount = :transaction_amount,
              #transaction_date = :transaction_date,
              #category = :category,
              #sub_category = :sub_category,
              #note = :note,
              #description = :description,
              #updated_date = :updated_date
              `,
        ExpressionAttributeNames: {
          "#source_account_id": "source_account_id",
          "#source_account_name": "source_account_name",
          "#destination_account_id": "destination_account_id",
          "#destination_account_name": "destination_account_name",
          "#transaction_type": "transaction_type",
          "#transaction_amount": "transaction_amount",
          "#transaction_date": "transaction_date",
          "#category": "category",
          "#sub_category": "sub_category",
          "#note": "note",
          "#description": "description",
          "#updated_date": "updated_date"
        },
        ExpressionAttributeValues: {
          ":source_account_id": userTransaction.source_account_id,
          ":source_account_name": userTransaction.source_account_name,
          ":destination_account_id": userTransaction.destination_account_id,
          ":destination_account_name": userTransaction.destination_account_name,
          ":transaction_type": userTransaction.transaction_type,
          ":transaction_amount": userTransaction.transaction_amount,
          ":transaction_date": userTransaction.transaction_date,
          ":category": userTransaction.category,
          ":sub_category": userTransaction.sub_category,
          ":note": userTransaction.note,
          ":description": userTransaction.description,
          ":updated_date": new Date().toLocaleString()
        }
      };

      await this.docClient
        .update(initialParams, function(err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log("updated Succesfuly", data);
          }
        })
        .promise();
      logger.info("User Transaction data persisted successfully");
      return userTransaction;
    } catch (err) {
      logger.error("Error occured while persisting data", err);
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
