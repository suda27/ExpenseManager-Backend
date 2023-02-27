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
  ) { }

  /**
   * Fetch All Transaction of a User
   * @param userDetails
   */
  async fetchAllTransactionOfUser(userDetails: User) {
    logger.info("fetchAllTransaction method of TransactionService");

    /* Check if user exists */
    const existingUser: User = await userService.getUserById(
      userDetails.userId
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

  /**
   * Fetch all Transactions of an Account
   * @param userAccountDetails
   */
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
  /**
   *  Fetch Single Transaction
   * @param userTransaction
   */
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
  /**
   * Update Transaction
   * @param updatedUserTransaction
   */
  async updateTransaction(updatedUserTransaction: UserTransaction) {
    logger.info(
      "updateTransaction method of TransactionService",
      updatedUserTransaction
    );

    try {
      const existingTransaction = await this.fetchSingleTransaction(
        updatedUserTransaction
      );
      if (!existingTransaction) {
        return null;
      }
      /**
       * All cases:
       * 1) Transaction Type remains same, But amount,account,category,note, transaction_date varies
       * 2) Transaction Type remains same, But account changes.
       * 3) Transaction Type remains same, But amount changes.
       * 4) Transaction Type changes, But amount,account,category,note, transaction_date remains same
       * 5) Transaction Type changes, But account changes.
       * 6) Transaction Type changes, But amount changes.
       */

      //Case 1 :  If transaction type remains same but amount,account,category,note, transaction_date varies
      if (
        existingTransaction.transaction_type ===
        updatedUserTransaction.transaction_type
      ) {
        console.log("Same transaction type");

        const checkIfAccountChanged =
          existingTransaction.source_account_id ===
          updatedUserTransaction.source_account_id &&
          existingTransaction.destination_account_id ===
          updatedUserTransaction.destination_account_id;

        //Check if account changed
        if (checkIfAccountChanged) {
          console.log("Same account");
          //Check if amount changed

          if (
            existingTransaction.transaction_amount ===
            updatedUserTransaction.transaction_amount
          ) {
            const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
              updatedUserTransaction
            );

            return updatedTransaction;
          } else {
            //When Amount is changed, for Transaction Type = Expense / Income
            const exisitngSourceUserAccount: UserAccount = await userAccountService.fetchSingleUserAccount(
              existingTransaction.source_account_id
            );

            //Condition check
            const checkIfUpdatedUserTransactionTypeIsNotTransfer =
              updatedUserTransaction.transaction_type !=
              TRANSACTION_TYPE.TRANSFER;

            if (checkIfUpdatedUserTransactionTypeIsNotTransfer) {
              return await this.amountChangedForTransactionTypeExpenseOrIncome(
                existingTransaction,
                updatedUserTransaction,
                exisitngSourceUserAccount
              );
            } else {
              //When Amount is changed, for Transaction Type = Transfer
              return await this.amountChangedForTransactionTypeTransfer(
                existingTransaction,
                updatedUserTransaction,
                exisitngSourceUserAccount
              );
            }
          }
        } else {
          //Condition Check
          const checkIfExisitngSourceAccountOrDestinationAccountIsChanged =
            existingTransaction.source_account_id !=
            updatedUserTransaction.source_account_id ||
            existingTransaction.destination_account_id !=
            updatedUserTransaction.destination_account_id;

          /**
           * If transaction account change
           */

          // If exisitng source account or destination account has been changed
          if (checkIfExisitngSourceAccountOrDestinationAccountIsChanged) {
            const existingUserSourceAccount = await userAccountService.fetchSingleUserAccount(
              existingTransaction.source_account_id
            );

            const newUserSourceAccount = await userAccountService.fetchSingleUserAccount(
              updatedUserTransaction.source_account_id
            );

            //If it's an Expense/Income transaction
            if (
              updatedUserTransaction.transaction_type !=
              TRANSACTION_TYPE.TRANSFER
            ) {
              return await this.sourceAccountChangedSameTransactionTypeExpenseOrIncome(
                existingUserSourceAccount,
                updatedUserTransaction,
                newUserSourceAccount
              );
            } else {
              // If account changed for Transfer Type

              // If source account is changed
              if (
                existingTransaction.source_account_id !=
                updatedUserTransaction.source_account_id
              ) {
                return await this.sourceAccountChangedSameTransactionTypeTransfer(
                  existingUserSourceAccount,
                  updatedUserTransaction,
                  newUserSourceAccount
                );
              }

              // If destination account is changed
              if (
                existingTransaction.destination_account_id !=
                updatedUserTransaction.destination_account_id
              ) {
                return await this.destinationAccountChangedSameTransactionTypeTransfer(
                  existingTransaction,
                  updatedUserTransaction
                );
              }
            }
          }
        }
      } else {
        //Condition Check check If Source Account Not Changed But Transaction Type Has Changed Except For Transfer
        const checkIfSourceAccountNotChangedButTransactionTypeHasChangedExceptForTransfer =
          existingTransaction.source_account_id ==
          updatedUserTransaction.source_account_id &&
          updatedUserTransaction.transaction_type !=
          TRANSACTION_TYPE.TRANSFER &&
          existingTransaction.transaction_type != TRANSACTION_TYPE.TRANSFER;

        // Condition Check  check If Source Account Changes Along With Transaction Type Except Transfer
        const checkIfSourceAccountChangesAlongWithTransactionTypeExceptTransfer =
          existingTransaction.source_account_id !=
          updatedUserTransaction.source_account_id &&
          updatedUserTransaction.transaction_type !=
          TRANSACTION_TYPE.TRANSFER &&
          existingTransaction.transaction_type != TRANSACTION_TYPE.TRANSFER &&
          updatedUserTransaction.transaction_type !=
          existingTransaction.transaction_type;

        // Condition Check  check If Source Account Same But Transaction Type Changed To Transfer
        const checkIfSourceAccountSameButTransactionTypeChangedToTransfer =
          existingTransaction.source_account_id ==
          updatedUserTransaction.source_account_id &&
          updatedUserTransaction.transaction_type ==
          TRANSACTION_TYPE.TRANSFER &&
          existingTransaction.transaction_type != TRANSACTION_TYPE.TRANSFER;

        // Condition Check  check If Soruce Account Changed Along With Tansaction Time From Expense Or
        // Income To Transfer To New User Account

        const checkIfSoruceAccountChangedAlongWithTansactionTypeFromExpenseOrIncomeToTransferToNewUserAccount =
          existingTransaction.source_account_id !=
          updatedUserTransaction.source_account_id &&
          updatedUserTransaction.transaction_type ==
          TRANSACTION_TYPE.TRANSFER &&
          existingTransaction.transaction_type != TRANSACTION_TYPE.TRANSFER &&
          updatedUserTransaction.transaction_type !=
          existingTransaction.transaction_type;

        const checkIfSoruceAccountChangedAlongWithTansactionTypeFromTransferToIncomeOrExpense =
          existingTransaction.source_account_id !=
          updatedUserTransaction.source_account_id &&
          updatedUserTransaction.transaction_type !=
          TRANSACTION_TYPE.TRANSFER &&
          existingTransaction.transaction_type == TRANSACTION_TYPE.TRANSFER &&
          updatedUserTransaction.transaction_type !=
          existingTransaction.transaction_type;


        const checkIfSoruceAccountNotChangedAlongWithTansactionTypeFromTransferToIncomeOrExpense =
          existingTransaction.source_account_id ==
          updatedUserTransaction.source_account_id &&
          updatedUserTransaction.transaction_type !=
          TRANSACTION_TYPE.TRANSFER &&
          existingTransaction.transaction_type == TRANSACTION_TYPE.TRANSFER &&
          updatedUserTransaction.transaction_type !=
          existingTransaction.transaction_type;

        // if source account not changed and transaction type is income/expense being modfied to vice-versa
        // XYZ Account : Income  ----> XYZ Account : Expense
        // XYZ Account : Expense  ----> XYZ Account : Income

        if (
          checkIfSourceAccountNotChangedButTransactionTypeHasChangedExceptForTransfer
        ) {
          const exisitngSourceUserAccount: UserAccount = await userAccountService.fetchSingleUserAccount(
            existingTransaction.source_account_id
          );

          exisitngSourceUserAccount.account_amount = String(
            updatedUserTransaction.transaction_type == TRANSACTION_TYPE.EXPENSE
              ? Number(exisitngSourceUserAccount.account_amount) -
              Number(updatedUserTransaction.transaction_amount) -
              Number(existingTransaction.transaction_amount)
              : Number(exisitngSourceUserAccount.account_amount) +
              Number(updatedUserTransaction.transaction_amount) +
              Number(existingTransaction.transaction_amount)
          );

          await userAccountData.updateSingleUserAccount(
            exisitngSourceUserAccount
          );

          const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
            updatedUserTransaction
          );
          return updatedTransaction;
        } else if (
          checkIfSourceAccountSameButTransactionTypeChangedToTransfer
        ) {
          console.log("I'm here...... --->");
          /**
           * Cases Handled :
           *  XYZ Account : Income  ----> XYZ Account : Transfer to ABC Account
           *  XYZ Account : Expense  ----> XYZ Account : Transfer to ABC Account
           * */

          const exisitngSourceUserAccount: UserAccount = await userAccountService.fetchSingleUserAccount(
            existingTransaction.source_account_id
          );

          if (!updatedUserTransaction.destination_account_id) {
            return null;
          }
          const newUserDestinationAccount: UserAccount = await userAccountService.fetchSingleUserAccount(
            updatedUserTransaction.destination_account_id
          );

          // XYZ Account : Income  ----> XYZ Account : Transfer

          exisitngSourceUserAccount.account_amount =
            existingTransaction.transaction_type == TRANSACTION_TYPE.EXPENSE
              ? String(
                Number(exisitngSourceUserAccount.account_amount) -
                (Number(updatedUserTransaction.transaction_amount) -
                  Number(existingTransaction.transaction_amount))
              )
              : String(
                Number(exisitngSourceUserAccount.account_amount) -
                Number(updatedUserTransaction.transaction_amount) -
                Number(existingTransaction.transaction_amount)
              );

          newUserDestinationAccount.account_amount = String(
            Number(newUserDestinationAccount.account_amount) +
            Number(updatedUserTransaction.transaction_amount)
          );

          await userAccountData.updateSingleUserAccount(
            exisitngSourceUserAccount
          );

          await userAccountData.updateSingleUserAccount(
            newUserDestinationAccount
          );

          const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
            updatedUserTransaction
          );
          return updatedTransaction;
        } else if (
          checkIfSourceAccountChangesAlongWithTransactionTypeExceptTransfer
        ) {
          // XYZ Income Transaction --> ABC Expense Transaction
          // XYZ Expense Transaction --> ABC Income Transaction

          const existingUserSourceAccount = await userAccountService.fetchSingleUserAccount(
            existingTransaction.source_account_id
          );

          if (!updatedUserTransaction.source_account_id) {
            return null; //Source Account ID on the Update transaction is empty
          }

          const newUserSourceAccount = await userAccountService.fetchSingleUserAccount(
            updatedUserTransaction.source_account_id
          );

          // For Scenario XYZ Income Transaction --> ABC Expense Transaction
          // Update Exisitng source account
          return await this.sourceAccountChangesDifferentTransactionTypeExceptTransfer(
            existingUserSourceAccount,
            updatedUserTransaction,
            existingTransaction,
            newUserSourceAccount
          );
        } else if (
          checkIfSoruceAccountChangedAlongWithTansactionTypeFromExpenseOrIncomeToTransferToNewUserAccount
        ) {
          // XYZ Income Transaction -> ABC Transfer to GHJ
          // XYZ Expense Transaction -> ABC Transfer to GHJ

          const existingUserSourceAccount = await userAccountService.fetchSingleUserAccount(
            existingTransaction.source_account_id
          );

          const newUserSourceAccount = await userAccountService.fetchSingleUserAccount(
            updatedUserTransaction.source_account_id
          );

          const newUserDestinationAccount = await userAccountService.fetchSingleUserAccount(
            updatedUserTransaction.destination_account_id
          );

          return await this.sourceAccountChangedAlongWithTransactionTypeTransfer(
            existingUserSourceAccount,
            existingTransaction,
            newUserSourceAccount,
            updatedUserTransaction,
            newUserDestinationAccount
          );
        } else if (
          checkIfSoruceAccountChangedAlongWithTansactionTypeFromTransferToIncomeOrExpense
        ) {
          console.log(
            "---->>> Source account changed along with TT from Tansfer to Income/Expense ----->>>>"
          );

          return await this.sourceAccountChangedAlongWithTTfromTransferToIncomeOrExpense(
            existingTransaction,
            updatedUserTransaction
          );
        } else if (checkIfSoruceAccountNotChangedAlongWithTansactionTypeFromTransferToIncomeOrExpense) {
          return await this.sourceAccountNotChangedAlongWithTTfromTransferToIncomeOrExpense(
            existingTransaction,
            updatedUserTransaction
          );
        }
      }
      return null;
    } catch (err) {
      logger.error(
        "Error at the Data layer, Caught at User Transaction Service",
        err
      );
      throw Error(`Error at the Data layer, Caught at Transaction Service`);
    }
  }

  /**
   * Add transaction
   * @param userTransaction
   */
  async addTransaction(userTransaction: UserTransaction) {
    logger.info("addTransaction method of TransactionService", userTransaction);


    /* Check if user exists */
    const existingUser = await userService.getUserById(userTransaction.userId);
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

  /**
   * Delete transaction
   * @param userTransaction 
   * 
   */
  async deleteTransaction(userTransaction: UserTransaction) {
    logger.info("deleteTransaction method of TransactionService", userTransaction);


    /* Check if user exists */
    const existingUser = await userService.getUserById(userTransaction.userId);
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

    if (userTransaction.transaction_type === TRANSACTION_TYPE.TRANSFER) {

      /* Check if user destination account exists */
      const destinationAccount = await userAccountService.fetchSingleUserAccount(
        userTransaction.destination_account_id
      );
      if (!destinationAccount) {
        return null;
      }

      // Add logic for transfer here

      // Transform Source Account Amount
      sourceAccount.account_amount = String(Number(userTransaction.transaction_amount) + Number(sourceAccount.account_amount));
      //Update source account amount detials
      await userAccountData.updateSingleUserAccount(sourceAccount);

      // Transform Destination Account Amount
      destinationAccount.account_amount = String(Number(destinationAccount.account_amount) - Number(userTransaction.transaction_amount));
      //Update Destination account amount detials
      await userAccountData.updateSingleUserAccount(destinationAccount);


    } else if (userTransaction.transaction_type === TRANSACTION_TYPE.EXPENSE) {
      sourceAccount.account_amount = String(Number(userTransaction.transaction_amount) + Number(sourceAccount.account_amount));

      //Update source account amount detials
      await userAccountData.updateSingleUserAccount(sourceAccount);

    } else if (userTransaction.transaction_type === TRANSACTION_TYPE.INCOME) {
      sourceAccount.account_amount = String(Number(sourceAccount.account_amount) - Number(userTransaction.transaction_amount));

      //Update source account amount detials
      await userAccountData.updateSingleUserAccount(sourceAccount);

    }

    //Update transaction details
    const updatedTransaction = await transactionData.deleteUserTransaction(
      userTransaction
    );
    return updatedTransaction;

  }


  private async sourceAccountChangedAlongWithTTfromTransferToIncomeOrExpense(
    existingTransaction: UserTransaction,
    updatedUserTransaction: UserTransaction
  ) {
    const existingUserSourceAccount = await userAccountService.fetchSingleUserAccount(
      existingTransaction.source_account_id
    );
    const existingUserDestinationAccount = await userAccountService.fetchSingleUserAccount(
      existingTransaction.destination_account_id
    );
    const newUserSourceAccount = await userAccountService.fetchSingleUserAccount(
      updatedUserTransaction.source_account_id
    );
    existingUserSourceAccount.account_amount = String(
      Number(existingUserSourceAccount.account_amount) +
      Number(existingTransaction.transaction_amount)
    );
    existingUserDestinationAccount.account_amount = String(
      Number(existingUserDestinationAccount.account_amount) -
      Number(existingTransaction.transaction_amount)
    );
    newUserSourceAccount.account_amount =
      updatedUserTransaction.transaction_type === TRANSACTION_TYPE.EXPENSE
        ? String(
          Number(newUserSourceAccount.account_amount) -
          Number(updatedUserTransaction.transaction_amount)
        )
        : String(
          Number(newUserSourceAccount.account_amount) +
          Number(updatedUserTransaction.transaction_amount)
        );
    //Update existing user source account amount detials
    await userAccountData.updateSingleUserAccount(existingUserSourceAccount);
    //Update existing user Destination account amount detials
    await userAccountData.updateSingleUserAccount(
      existingUserDestinationAccount
    );
    //Update new user source account amount detials
    await userAccountData.updateSingleUserAccount(newUserSourceAccount);
    //Update transaction details
    const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
      updatedUserTransaction
    );
    return updatedTransaction;
  }

  private async sourceAccountNotChangedAlongWithTTfromTransferToIncomeOrExpense(existingTransaction: UserTransaction,
    updatedUserTransaction: UserTransaction) {
    const existingUserSourceAccount = await userAccountService.fetchSingleUserAccount(
      existingTransaction.source_account_id
    );
    const existingUserDestinationAccount = await userAccountService.fetchSingleUserAccount(
      existingTransaction.destination_account_id
    );

    existingUserDestinationAccount.account_amount = String(
      Number(existingUserDestinationAccount.account_amount) -
      Number(existingTransaction.transaction_amount)
    );
    existingUserSourceAccount.account_amount =
      updatedUserTransaction.transaction_type === TRANSACTION_TYPE.EXPENSE
        ? String(
          Number(existingUserSourceAccount.account_amount) -
          (Number(updatedUserTransaction.transaction_amount) - Number(existingTransaction.transaction_amount))
        )
        : String(
          Number(existingUserSourceAccount.account_amount) +
          Number(updatedUserTransaction.transaction_amount) + Number(existingTransaction.transaction_amount)
        );
    //Update existing user source account amount detials
    await userAccountData.updateSingleUserAccount(existingUserSourceAccount);
    //Update existing user Destination account amount detials
    await userAccountData.updateSingleUserAccount(
      existingUserDestinationAccount
    );

    //Update transaction details
    const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
      updatedUserTransaction
    );
    return updatedTransaction;
  }

  private async sourceAccountChangedAlongWithTransactionTypeTransfer(
    existingUserSourceAccount: UserAccount,
    existingTransaction: UserTransaction,
    newUserSourceAccount: UserAccount,
    updatedUserTransaction: UserTransaction,
    newUserDestinationAccount: UserAccount
  ) {
    console.log(
      "----->>>> sourceAccountChangedAlongWithTransactionTypeTransfer ------->>>>>"
    );
    existingUserSourceAccount.account_amount =
      existingTransaction.transaction_type === TRANSACTION_TYPE.EXPENSE
        ? String(
          Number(existingUserSourceAccount.account_amount) +
          Number(existingTransaction.transaction_amount)
        )
        : String(
          Number(existingUserSourceAccount.account_amount) -
          Number(existingTransaction.transaction_amount)
        );
    newUserSourceAccount.account_amount = String(
      Number(newUserSourceAccount.account_amount) -
      Number(updatedUserTransaction.transaction_amount)
    );
    newUserDestinationAccount.account_amount = String(
      Number(newUserDestinationAccount.account_amount) +
      Number(updatedUserTransaction.transaction_amount)
    );
    //Update existing user source account amount detials
    await userAccountData.updateSingleUserAccount(existingUserSourceAccount);
    //Update new user source account amount detials
    await userAccountData.updateSingleUserAccount(newUserSourceAccount);
    //Update new user Destination account amount detials
    await userAccountData.updateSingleUserAccount(newUserDestinationAccount);
    //Update transaction details
    const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
      updatedUserTransaction
    );
    return updatedTransaction;
  }

  private async sourceAccountChangesDifferentTransactionTypeExceptTransfer(
    existingUserSourceAccount: UserAccount,
    updatedUserTransaction: UserTransaction,
    existingTransaction: UserTransaction,
    newUserSourceAccount: UserAccount
  ) {
    console.log("Soruce Account Changed Along with Transaction Type");
    existingUserSourceAccount.account_amount =
      updatedUserTransaction.transaction_type == TRANSACTION_TYPE.EXPENSE
        ? String(
          Number(existingUserSourceAccount.account_amount) -
          Number(existingTransaction.transaction_amount)
        )
        : String(
          Number(existingUserSourceAccount.account_amount) +
          Number(existingTransaction.transaction_amount)
        );
    // For Scenario XYZ Expense Transaction --> ABC Income Transaction
    // Update New source account
    newUserSourceAccount.account_amount =
      updatedUserTransaction.transaction_type == TRANSACTION_TYPE.EXPENSE
        ? String(
          Number(newUserSourceAccount.account_amount) -
          Number(updatedUserTransaction.transaction_amount)
        )
        : String(
          Number(newUserSourceAccount.account_amount) +
          Number(updatedUserTransaction.transaction_amount)
        );
    //Update existing user account amount detials
    await userAccountData.updateSingleUserAccount(existingUserSourceAccount);
    //Update new user account amount detials
    await userAccountData.updateSingleUserAccount(newUserSourceAccount);
    //Update transaction details
    const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
      updatedUserTransaction
    );
    return updatedTransaction;
  }

  private async sourceAccountChangedSameTransactionTypeExpenseOrIncome(
    existingUserSourceAccount: UserAccount,
    updatedUserTransaction: UserTransaction,
    newUserSourceAccount: UserAccount
  ) {
    existingUserSourceAccount.account_amount =
      updatedUserTransaction.transaction_type === TRANSACTION_TYPE.EXPENSE // If it's an expense, add amount to source account else subtract from source account
        ? String(
          Number(existingUserSourceAccount.account_amount) +
          Number(updatedUserTransaction.transaction_amount)
        )
        : String(
          Number(existingUserSourceAccount.account_amount) -
          Number(updatedUserTransaction.transaction_amount)
        );
    newUserSourceAccount.account_amount =
      updatedUserTransaction.transaction_type === TRANSACTION_TYPE.EXPENSE
        ? String(
          Number(newUserSourceAccount.account_amount) -
          Number(updatedUserTransaction.transaction_amount)
        )
        : String(
          Number(newUserSourceAccount.account_amount) +
          Number(updatedUserTransaction.transaction_amount)
        );
    //Update existing user account amount detials
    await userAccountData.updateSingleUserAccount(existingUserSourceAccount);
    //Update new user account amount detials
    await userAccountData.updateSingleUserAccount(newUserSourceAccount);
    //Update transaction details
    const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
      updatedUserTransaction
    );
    return updatedTransaction;
  }

  private async sourceAccountChangedSameTransactionTypeTransfer(
    existingUserSourceAccount: UserAccount,
    updatedUserTransaction: UserTransaction,
    newUserSourceAccount: UserAccount
  ) {
    existingUserSourceAccount.account_amount = String(
      Number(existingUserSourceAccount.account_amount) +
      Number(updatedUserTransaction.transaction_amount)
    );
    newUserSourceAccount.account_amount = String(
      Number(newUserSourceAccount.account_amount) -
      Number(updatedUserTransaction.transaction_amount)
    );
    //Update existing user account amount detials
    await userAccountData.updateSingleUserAccount(existingUserSourceAccount);
    //Update new user account amount detials
    await userAccountData.updateSingleUserAccount(newUserSourceAccount);
    //Update transaction details
    const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
      updatedUserTransaction
    );
    return updatedTransaction;
  }

  private async destinationAccountChangedSameTransactionTypeTransfer(
    existingTransaction: UserTransaction,
    updatedUserTransaction: UserTransaction
  ) {
    console.log("Destination changed");
    const existingUserDestinationAccount = await userAccountData.fetchSingleUserAccount(
      existingTransaction.destination_account_id
    );
    const newUserDestinationAccount = await userAccountData.fetchSingleUserAccount(
      updatedUserTransaction.destination_account_id
    );
    existingUserDestinationAccount.account_amount = String(
      Number(existingUserDestinationAccount.account_amount) -
      Number(updatedUserTransaction.transaction_amount)
    );
    newUserDestinationAccount.account_amount = String(
      Number(newUserDestinationAccount.account_amount) +
      Number(updatedUserTransaction.transaction_amount)
    );
    //Update existing user account amount detials
    await userAccountData.updateSingleUserAccount(
      existingUserDestinationAccount
    );
    //Update new user account amount detials
    await userAccountData.updateSingleUserAccount(newUserDestinationAccount);
    //Update transaction details
    const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
      updatedUserTransaction
    );
    return updatedTransaction;
  }

  private async amountChangedForTransactionTypeExpenseOrIncome(
    existingTransaction: any,
    updatedUserTransaction: UserTransaction,
    exisitngSourceUserAccount: UserAccount
  ) {
    const differenceAmount: number =
      Number(existingTransaction.transaction_amount) -
      Number(updatedUserTransaction.transaction_amount);
    /**
     * If it's an expense add the difference, if it's an income, subtract the difference
     *  */
    exisitngSourceUserAccount.account_amount =
      updatedUserTransaction.transaction_type === TRANSACTION_TYPE.EXPENSE
        ? String(
          Number(exisitngSourceUserAccount.account_amount) + differenceAmount
        )
        : String(
          Number(exisitngSourceUserAccount.account_amount) - differenceAmount
        );
    await userAccountData.updateSingleUserAccount(exisitngSourceUserAccount);
    const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
      updatedUserTransaction
    );
    return updatedTransaction;
  }

  private async amountChangedForTransactionTypeTransfer(
    existingTransaction: UserTransaction,
    updatedUserTransaction: UserTransaction,
    exisitngSourceUserAccount: UserAccount
  ) {
    const exisitngDestinationUserAccount: UserAccount = await userAccountService.fetchSingleUserAccount(
      existingTransaction.destination_account_id
    );
    const differenceAmount: number =
      Number(existingTransaction.transaction_amount) -
      Number(updatedUserTransaction.transaction_amount);
    //Set the updated source account amount
    exisitngSourceUserAccount.account_amount = String(
      Number(exisitngSourceUserAccount.account_amount) + differenceAmount
    );
    //Set the updated destination account amount
    exisitngDestinationUserAccount.account_amount = String(
      Number(exisitngDestinationUserAccount.account_amount) - differenceAmount
    );
    //Update source account
    await userAccountData.updateSingleUserAccount(exisitngSourceUserAccount);
    //Update destination account
    await userAccountData.updateSingleUserAccount(
      exisitngDestinationUserAccount
    );
    //Update Transaction Details
    const updatedTransaction = await transactionData.updateUserTransactionForSameTransactionType(
      updatedUserTransaction
    );
    return updatedTransaction;
  }

  private async transferTransaction(
    destinationAccount: UserAccount,
    userTransaction: UserTransaction,
    sourceAccount: UserAccount
  ) {

    if (sourceAccount.accountID == destinationAccount.accountID) {
      const response = {
        destinationAccount,
        sourceAccount,
        userTransaction
      };
      return response;
    }
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
    const transferTransaction = await transactionData.addTransaction(
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
    const incomeTransaction = await transactionData.addTransaction(
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
    const expenseTransaction = await transactionData.addTransaction(
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
    userTransaction.created_date = new Date().toISOString();
    userTransaction.updated_date = new Date().toISOString();
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
