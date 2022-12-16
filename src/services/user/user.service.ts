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
  ) { }

  // Create User
  async createUser(userDeatils: User) {
    logger.info("createUser method of UserService", userDeatils);

    /* Check if user already exists */
    const existingUser = await this.getUserByEmail(userDeatils.email);
    console.log('Exisiting user status -->', existingUser)
    if (existingUser) {
      console.log("User Already Exist");
      return null;
    }

    /* Set attributes Created_date, Status and generate UserID */
    userDeatils.email = userDeatils.email.toLowerCase();
    userDeatils.created_date = new Date().toLocaleString();
    userDeatils.updated_date = new Date().toLocaleString();
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

  // Update User
  async updateUser(userDeatils: User) {
    logger.info("updateUser method of UserService", userDeatils);

    /* Check if user exists */
    const existingUser = await this.getUserById(userDeatils.userID);
    console.log("Okay exisintg user check -->", existingUser);
    if (!existingUser) {
      return null;
    }

    const updateUser: User = constructUpdateUserDetailsData(
      existingUser[0],
      userDeatils
    );
    try {
      /* Create user */
      const response = await userData.updateUserDetails(updateUser);
      return response;
    } catch (err) {
      logger.error("Error at the Data layer, Caught at User Service", err);
      throw Error(`Error at the Data layer, Caught at User Service`);
    }
  }

  // Delete User
  async deleteUser(userDeatils: User) {
    logger.info("deleteUser method of UserService", userDeatils);

    /* Check if user exists */
    const existingUser = await this.getUserById(userDeatils.userID);
    if (!existingUser) {
      return null;
    }

    const inactiveUser = { ...existingUser, status: STAUS.INACTIVE };

    const updateUser: User = constructUpdateUserDetailsData(

      existingUser, inactiveUser
    );
    try {
      /* Update user */
      const response = await userData.updateUserDetails(updateUser);
      return response;
    } catch (err) {
      logger.error("Error at the Data layer, Caught at User Service", err);
      throw Error(`Error at the Data layer, Caught at User Service`);
    }
  }

  // Get User By Email
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

  // Get User By ID
  async getUserById(userID: string) {
    logger.info("getUserByID method of UserService");
    try {
      /* Get user list by ID */
      const user = await userData.getUsersByID(userID);
      return user;
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

/* 
Helper Functions of User Services
*/
function constructUpdateUserDetailsData(
  existingUser: DocumentClient.AttributeMap,
  userDeatils: User
): User {
  return {
    userID: existingUser.userID,
    currency:
      existingUser.currency == userDeatils.currency
        ? existingUser.currency
        : userDeatils.currency,
    name:
      existingUser.name == userDeatils.name
        ? existingUser.name
        : userDeatils.name,
    profile_pic:
      existingUser.profile_pic == userDeatils.profile_pic
        ? existingUser.profile_pic
        : userDeatils.profile_pic,
    email: existingUser.email,
    status:
      existingUser.status === userDeatils.status
        ? existingUser.status
        : userDeatils.status,
    created_date: existingUser.created_date,
    updated_date: new Date().toLocaleString()
  };
}
