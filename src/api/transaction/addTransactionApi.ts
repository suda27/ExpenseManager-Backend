import { APIGatewayEvent, Handler, APIGatewayProxyResult } from "aws-lambda";
import { formatErrorJSONResponse } from "../../utils/ResponseUtils";
import logger from "../../utils/logger";
import { HTTP } from "../../constants/http.constants";
import { formatJSONResponse } from "../../utils/ResponseUtils";
import transactionService from "../../services/transaction/transaction.service";
import UserTransaction from "../../models/userTransaction.model";

export class addTransactionApi {
  /*
  This lambda function will add a new transaction information details of the User to dynamo db
  */
  static async handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const userTransactionDeatils: UserTransaction = JSON.parse(event.body);
        logger.info("At the addTransactionApi ", userTransactionDeatils);
        const response = await transactionService.addTransaction(
          userTransactionDeatils
        );
        resolve(
          formatJSONResponse(
            response != null ? HTTP.SUCCESS : HTTP.BAD_REQUEST,
            response != null
              ? "User Transaction Data Saved Successfully"
              : "User / Account Doesn't Exist in the System",
            response
          )
        );
      } catch (err) {
        reject(formatErrorJSONResponse(HTTP.SYSTEM_ERROR, err.message, err));
      }
    });
  }
}
export const handler = addTransactionApi.handler;
