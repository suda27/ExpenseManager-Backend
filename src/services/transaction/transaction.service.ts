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
      } catch (err) {
        logger.error(
          "Error at the Data layer, Caught at User Transaction Service",
          err
        );
        throw Error(`Error at the Data layer, Caught at User Service`);
      }
    } else if (userTransaction.transaction_type == TRANSACTION_TYPE.INCOME) {
      try {
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
      } catch (err) {
        logger.error(
          "Error at the Data layer, Caught at User Transaction Service",
          err
        );
        throw Error(`Error at the Data layer, Caught at User Service`);
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
      } catch (err) {
        logger.error(
          "Error at the Data layer, Caught at User Transaction Service",
          err
        );
        throw Error(`Error at the Data layer, Caught at User Service`);
      }
    }
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
