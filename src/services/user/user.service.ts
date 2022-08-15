import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import User from "../../models/userInput.model";
import logger from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import userData from "../../data/user/user.data";

class UserService {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string
  ) {
    console.log(tableName);
  }

  async createUser(userDeatils: User) {
    logger.info("createUser method of UserService", userDeatils);
    console.log("At user svc", userDeatils);
    userDeatils.created_date = new Date().toLocaleString();
    console.log("created_date", new Date().toLocaleString());
    userDeatils.status = "ACTIVE";
    console.log("status", userDeatils.status);
    userDeatils.userID = uuidv4();
    console.log("userID", userDeatils.userID);
    console.log(userDeatils);
    try {
      const response = await userData.createUser(userDeatils);
      console.log(response);
      return response;
    } catch (err) {
      console.error("Error at the Data layer, Caught at User Service", err);
      logger.error("Error at the Data layer, Caught at User Service", err);
      throw Error(`Error at the Data layer, Caught at User Service`);
    }
  }
}

const userService = new UserService(
  createDynamoDBClient(),
  process.env.USER_TABLE
);
export default userService;
