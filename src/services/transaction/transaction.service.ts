import { DocumentClient } from "aws-sdk/clients/dynamodb";
import createDynamoDBClient from "../../config/db.config";
import User from "../../models/userInput.model";
import logger from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import userData from "../../data/user/user.data";
import userAccountData from "../../data/useraccount/user-account.data";
import userService from "../user/user.service";
import userAccountService from "../useraccount/user-account.service";
import { STAUS } from "../../constants/application.constant";
import UserTransaction from "../../models/userTransaction.model";
import { TRANSACTION_TYPE } from "../../constants/transaction.constant";
import transactionData from "../../data/transaction/transaction.data";

class TransactionService {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string
  ) {}

  async addTransaction(userTransaction: UserTransaction) {
    logger.info("addTransaction method of TransactionService", userTransaction);

    /* Check if user exists */
    const existingUser = await userService.getUserById(userTransaction.userID);
    if (!existingUser) {
      return null;
    }

    /* Check if user source account exists */
    const sourceAccount = await userAccountService.fetchSingleUserAccount(
      userTransaction.source_account_id
    );
    if (!sourceAccount) {
      return null;
    }

    // Generate User Transaction ID
    this.generateUserTransactionID(userTransaction);

    /* If transaction type is Expense, Insert record into User-Transaction table 
    and Update record in the User-Accounts table */

    if (userTransaction.transaction_type == TRANSACTION_TYPE.EXPENSE) {
      try {
        const expenseTransaction = await transactionData.addExpenseTransaction(
          userTransaction
        );
        const userAfterExpenseSourceAmount: number = this.calculatExpense(
          sourceAccount,
          userTransaction
        );

        sourceAccount.account_amount = String(userAfterExpenseSourceAmount);

        const updateSourceAccount = await userAccountData.updateSingleUserAccount(
          sourceAccount
        );
        const response = {
          expenseTransaction,
          updateSourceAccount
        };
        return response;
      } catch (err) {
        logger.error(
          "Error at the Data layer, Caught at User Transaction Service",
          err
        );
        throw Error(`Error at the Data layer, Caught at User Service`);
      }
    }

    /* If transaction type is Transfer check Destination soruce account exist*/
    if (userTransaction.transaction_type == TRANSACTION_TYPE.TRANSFER) {
      const destinationAccount = await userAccountService.fetchSingleUserAccount(
        userTransaction.destination_account_id
      );
      if (!destinationAccount) {
        return null;
      }
    }
  }

  private generateUserTransactionID(userTransaction: UserTransaction) {
    userTransaction.transactionID = uuidv4();
    userTransaction.created_date = new Date().toLocaleString();
    userTransaction.updated_date = new Date().toLocaleString();
  }

  private calculatExpense(sourceAccount, userTransaction) {
    const userSourceAmount: number = +sourceAccount.account_amount;
    const userTransactionAmount: number = +userTransaction.transaction_amount;
    const userAfterExpenseSourceAmount: number =
      userSourceAmount - userTransactionAmount;
    return userAfterExpenseSourceAmount;
  }
}
const transactionService = new TransactionService(
  createDynamoDBClient(),
  process.env.USER_TRANSACTION_TABLE
);

export default transactionService;
