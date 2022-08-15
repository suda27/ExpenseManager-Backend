import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import User from "../../models/userInput.model";
import logger from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import userData from "../../data/user/user.data";
import { STAUS } from "../../constants/application.constant";

class UserService {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string
  ) {}

  async createUser(userDeatils: User) {
    logger.info("createUser method of UserService", userDeatils);

    /* Check if user already exists */
    const existingUserList = await this.getUserByEmail(userDeatils.email);
    if (existingUserList.length) {
      console.log("User Already Exist");
      return null;
    }

    /* Set attributes Created_date, Status and generate UserID */
    userDeatils.created_date = new Date().toLocaleString();
    userDeatils.status = STAUS.ACTIVE;
    userDeatils.userID = uuidv4();

    try {
      /* Create user */
      const response = await userData.createUser(userDeatils);
      return response;
    } catch (err) {
      logger.error("Error at the Data layer, Caught at User Service", err);
      throw Error(`Error at the Data layer, Caught at User Service`);
    }
  }

  async getUserByEmail(email: string) {
    logger.info("getUserByEmail method of UserService");
    try {
      /* Get user list by email */
      const userList = await userData.getUsersByEmail(email);
      return userList;
    } catch (err) {
      logger.error("Error at the Data layer, Caught at User Service", err);
      throw Error(`Error at the Data layer, Caught at User Service`);
    }
  }

  async getUserById(userID: string) {
    logger.info("getUserByEmail method of UserService");
    try {
      /* Get user list by email */
      const userList = await userData.getUsersByID(userID);
      return userList;
    } catch (err) {
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
