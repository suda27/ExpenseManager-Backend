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
import UserAccount from "../../models/userAccount.model";

class TransactionService {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string
  ) {}

  async fetchAllTransactionOfUser(userDetails: User) {
    logger.info("fetchAllTransaction method of TransactionService");

    /* Check if user exists */
    const existingUser: User = await userService.getUserById(
      userDetails.userID
    );
    if (!existingUser) {
      return null;
    }

    try {
      const fetchAllUserTransaction: UserTransaction[] = await transactionData.fetchAllTransactionOfUser(
        userDetails
      );
      return fetchAllUserTransaction;
    } catch (err) {
      logger.error(
        "Error at the Data layer, Caught at User Transaction Service",
        err
      );
      throw Error(`Error at the Data layer, Caught at Transaction Service`);
    }
  }

  async fetchAllTransactionOfAccount(userAccountDetails: UserAccount) {
    logger.info("fetchAllTransaction method of TransactionService");

    /* Check if account exists */
    const existingAccount = await userAccountService.fetchSingleUserAccount(
      userAccountDetails.accountID
    );
    if (!existingAccount) {
      return null;
    }

    try {
      const fetchAllAccountTransaction: UserTransaction[] = await transactionData.fetchAllTransactionOfAccount(
        userAccountDetails
      );
      return fetchAllAccountTransaction;
    } catch (err) {
      logger.error(
        "Error at the Data layer, Caught at User Transaction Service",
        err
      );
      throw Error(`Error at the Data layer, Caught at Transaction Service`);
    }
  }

  async fetchSingleTransaction(userTransaction: UserTransaction) {
    logger.info(
      "fetchSingleTransaction method of TransactionService",
      userTransaction
    );

    try {
      const fetchedUserTransaction = await transactionData.fetchSingleTransaction(
        userTransaction
      );
      return fetchedUserTransaction;
    } catch (err) {
      logger.error(
        "Error at the Data layer, Caught at User Transaction Service",
        err
      );
      throw Error(`Error at the Data layer, Caught at Transaction Service`);
    }
  }

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
        return await this.expenseTransaction(userTransaction, sourceAccount);
      } catch (err) {
        logger.error(
          "Error at the Data layer, Caught at User Transaction Service",
          err
        );
        throw Error(`Error at the Data layer, Caught at Transaction Service`);
      }
    } else if (userTransaction.transaction_type == TRANSACTION_TYPE.INCOME) {
      /* If transaction type is Income, Insert record into User-Transaction table 
    and Update record in the User-Accounts table */
      try {
        return await this.incomeTransaction(userTransaction, sourceAccount);
      } catch (err) {
        logger.error(
          "Error at the Data layer, Caught at User Transaction Service",
          err
        );
        throw Error(`Error at the Data layer, Caught at Transaction Service`);
      }
    } else if (userTransaction.transaction_type == TRANSACTION_TYPE.TRANSFER) {
      try {
        /* If transaction type is Transfer check Destination soruce account exist*/
        const destinationAccount = await userAccountService.fetchSingleUserAccount(
          userTransaction.destination_account_id
        );
        if (!destinationAccount) {
          return null;
        }
        /*/ Calculate transfer by treating as an Expense in Source Account
      and Income in Destination Account */
        return await this.transferTransaction(
          destinationAccount,
          userTransaction,
          sourceAccount
        );
      } catch (err) {
        logger.error(
          "Error at the Data layer, Caught at User Transaction Service",
          err
        );
        throw Error(`Error at the Data layer, Caught at Transaction Service`);
      }
    }
  }

  private async transferTransaction(
    destinationAccount: UserAccount,
    userTransaction: UserTransaction,
    sourceAccount: UserAccount
  ) {
    // Income Destination Calculation
    const userAfterIncomeDestinationAmount: number = this.calculatIncome(
      destinationAccount,
      userTransaction
    );
    destinationAccount.account_amount = String(
      userAfterIncomeDestinationAmount
    );
    const updateDestinationAccount = await userAccountData.updateSingleUserAccount(
      destinationAccount
    );
    // Expense Source Calculation
    const userAfterExpenseSourceAmount: number = this.calculatExpense(
      sourceAccount,
      userTransaction
    );
    sourceAccount.account_amount = String(userAfterExpenseSourceAmount);
    const updateSourceAccount = await userAccountData.updateSingleUserAccount(
      sourceAccount
    );
    const transferTransaction = await transactionData.addExpenseTransaction(
      userTransaction
    );
    const response = {
      updateDestinationAccount,
      updateSourceAccount,
      transferTransaction
    };
    return response;
  }

  private async incomeTransaction(
    userTransaction: UserTransaction,
    sourceAccount: UserAccount
  ) {
    const incomeTransaction = await transactionData.addExpenseTransaction(
      userTransaction
    );
    //calculate Income
    const userAfterIncomeSourceAmount: number = this.calculatIncome(
      sourceAccount,
      userTransaction
    );
    sourceAccount.account_amount = String(userAfterIncomeSourceAmount);
    const updateSourceAccount = await userAccountData.updateSingleUserAccount(
      sourceAccount
    );
    const response = {
      incomeTransaction,
      updateSourceAccount
    };
    return response;
  }

  private async expenseTransaction(
    userTransaction: UserTransaction,
    sourceAccount: UserAccount
  ) {
    const expenseTransaction = await transactionData.addExpenseTransaction(
      userTransaction
    );
    //calculate Expense
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
  }

  private generateUserTransactionID(userTransaction: UserTransaction) {
    userTransaction.transactionID = uuidv4();
    userTransaction.created_date = new Date().toLocaleString();
    userTransaction.updated_date = new Date().toLocaleString();
  }

  private calculatExpense(account, userTransaction) {
    const userAmount: number = +account.account_amount;
    const userTransactionAmount: number = +userTransaction.transaction_amount;
    const userAfterExpenseAmount: number = userAmount - userTransactionAmount;
    return userAfterExpenseAmount;
  }

  private calculatIncome(account, userTransaction) {
    const userAmount: number = +account.account_amount;
    const userTransactionAmount: number = +userTransaction.transaction_amount;
    const userAfteIncomeAmount: number = userAmount + userTransactionAmount;
    return userAfteIncomeAmount;
  }
}
const transactionService = new TransactionService(
  createDynamoDBClient(),
  process.env.USER_TRANSACTION_TABLE
);

export default transactionService;
