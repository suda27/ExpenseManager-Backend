import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import User from "../../models/userInput.model";
import logger from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import userAccountData from "../../data/useraccount/user-account.data";
import userService from "../user/user.service";
import { STAUS } from "../../constants/application.constant";
import UserAccount from "../../models/userAccount.model";
import { fetchUserAccountsApi } from "../../api/useraccount/fetchUserAccountsApi";

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
    if (!existingUserList) {
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

  async fetchUserAccounts(userDetails: User) {
    try {
      logger.info("fetchUserAccounts at User Account Service");
      const response = await userAccountData.fetchUserAccounts(userDetails);
      return response;
    } catch (err) {
      logger.error(
        "Error at the Data layer, Caught at User Account Service",
        err
      );
      throw Error(`Error at the Data layer, Caught at User Account Service`);
    }
  }

  async fetchSingleUserAccount(accountID: string) {
    try {
      logger.info("fetchSingleUserAccount at User Account Service");
      const response = await userAccountData.fetchSingleUserAccount(accountID);
      return response;
    } catch (err) {
      console.log(err);
      logger.error(
        "Error at the Data layer, Caught at User Account Service",
        err
      );
      throw Error(`Error at the Data layer, Caught at User Account Service`);
    }
  }

  async updateSingleUserAccount(userAccountDetails: UserAccount) {
    try {
      logger.info("updateSingleUserAccountApi at User Account Service");
      console.log(userAccountDetails.accountID);
      const existingUserAccount = await this.fetchSingleUserAccount(
        userAccountDetails.accountID
      );
      if (!existingUserAccount) {
        console.log("account doesn't exist");
        return null;
      }
      const response = await userAccountData.updateSingleUserAccount(
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
