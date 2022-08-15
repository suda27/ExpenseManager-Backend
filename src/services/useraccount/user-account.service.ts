import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import User from "../../models/userInput.model";
import logger from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import userAccountData from "../../data/useraccount/user-account.data";
import userService from "../user/user.service";
import { STAUS } from "../../constants/application.constant";
import UserAccount from "../../models/userAccount.model";

class UserAccountService {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string
  ) {}

  async createUserAccount(userAccountDetails: UserAccount) {
    logger.info(
      "createUserAccount method of UserAccountService",
      userAccountDetails
    );

    /* Check if user already exists */
    const existingUserList = await userService.getUserById(
      userAccountDetails.userID
    );
    if (!existingUserList.length) {
      console.log("User Doesn't Exist");
      return null;
    }

    /* Set attributes account_created_date,account_updated_date, Status and generated AccountID */
    userAccountDetails.account_created_date = new Date().toLocaleString();
    userAccountDetails.account_updated_date = new Date().toLocaleString();
    userAccountDetails.account_status = STAUS.ACTIVE;
    userAccountDetails.accountID = uuidv4();

    try {
      /* Create user Account */
      const response = await userAccountData.createUserAccount(
        userAccountDetails
      );
      return response;
    } catch (err) {
      logger.error(
        "Error at the Data layer, Caught at User Account Service",
        err
      );
      throw Error(`Error at the Data layer, Caught at User Account Service`);
    }
  }
}

const userAccountService = new UserAccountService(
  createDynamoDBClient(),
  process.env.USER_ACCOUNT_TABLE
);

export default userAccountService;
