import { APIGatewayEvent, Handler, APIGatewayProxyResult } from "aws-lambda";
import { formatErrorJSONResponse } from "../../utils/ResponseUtils";
import logger from "../../utils/logger";
import { HTTP } from "../../constants/http.constants";
import { formatJSONResponse } from "../../utils/ResponseUtils";
import transactionService from "../../services/transaction/transaction.service";
import UserTransaction from "../../models/userTransaction.model";

export class fetchSingleTransactionApi {
  /*
  This lambda function will add a new transaction information details of the User to dynamo db
  */
  static async handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const userTransactionDeatils: UserTransaction = JSON.parse(event.body);
        logger.info(
          "At the fetchSingleTransactionApi ",
          userTransactionDeatils
        );
        const response = await transactionService.fetchSingleTransaction(
          userTransactionDeatils
        );
        resolve(
          formatJSONResponse(
            response != null ? HTTP.SUCCESS : HTTP.BAD_REQUEST,
            response != null
              ? "User Transaction Data fetched Successfully"
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
export const handler = fetchSingleTransactionApi.handler;
