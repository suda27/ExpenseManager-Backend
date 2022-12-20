import User from "../../models/userInput.model";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import logger from "../../utils/logger";
import { STAUS } from "../../constants/application.constant";

class UserData {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string
  ) { }

  async createUser(userDeatils: User) {
    logger.info("createUser method in UserData", userDeatils);
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

  async updateUserDetails(userDeatils: User) {
    logger.info("updateUserDetails method in UserData", userDeatils);
    try {
      const initialParams = {
        TableName: this.tableName,
        Item: userDeatils
      };
      await this.docClient.put(initialParams).promise();
      logger.info("User data updated successfuly");
      return userDeatils;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while updating data to ${this.tableName}`
      );
    }
  }

  async getUser(userDetails: User) {
    logger.info("getUserByEmail method in UserData");
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          userId: userDetails.userId,
          email: userDetails.email
        },
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": STAUS.ACTIVE
        }
      };
      console.log(params);
      const data = await this.docClient.scan(params, (err, data) => {
        console.log("data", data);
        console.log("error", err);
      }).promise();
      if (!data || !data.Items.length) {
        logger.info("No data found");
        return null;
      }

      const fetchedUser = User.fromItem(data.Items[0]);
      return fetchedUser;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while fetching data from ${this.tableName}`
      );
    }
  }

  async getUsersByEmail(email: string) {
    logger.info("getUserByEmail method in UserData");
    try {
      const params = {
        TableName: this.tableName,

        FilterExpression: "#email = :email and #status = :status",
        ExpressionAttributeNames: {
          "#email": "email",
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": STAUS.ACTIVE,
          ":email": email
        }
      };
      console.log(params);
      const data = await this.docClient.scan(params, (err, data) => {
        console.log("data", data);
        console.log("error", err);
      }).promise();
      if (!data || !data.Items.length) {
        logger.info("No data found");
        return null;
      }

      const fetchedUser = User.fromItem(data.Items[0]);
      return fetchedUser;
    } catch (error) {
      logger.error("Error occured while persisting data", error);
      throw Error(
        `There was an error while fetching data from ${this.tableName}`
      );
    }
  }

  async getUsersByID(userID: string) {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "#userID = :userID",

      FilterExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#userID": "userID",
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":status": STAUS.ACTIVE,
        ":userID": userID
      }
    };
    console.log(params)
    const data = await this.docClient.query(params).promise();
    logger.info(data);
    if (!data || !data.Items.length) {
      logger.info("No data found");
      return null;
    }

    const fetchedUser = User.fromItem(data.Items[0]);
    return fetchedUser;
  }
}

const userData = new UserData(createDynamoDBClient(), process.env.USER_TABLE);
export default userData;
