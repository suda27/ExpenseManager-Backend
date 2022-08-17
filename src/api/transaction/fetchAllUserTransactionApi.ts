import { APIGatewayEvent, Handler, APIGatewayProxyResult } from "aws-lambda";
import { formatErrorJSONResponse } from "../../utils/ResponseUtils";
import logger from "../../utils/logger";
import { HTTP } from "../../constants/http.constants";
import { formatJSONResponse } from "../../utils/ResponseUtils";
import transactionService from "../../services/transaction/transaction.service";
import UserTransaction from "../../models/userTransaction.model";
import User from "../../models/userInput.model";

export class fetchAllUserTransactionApi {
  /*
  This lambda function will fetch all transaction information details of the User from dynamo db
  */
  static async handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const userDetails: User = JSON.parse(event.body);
        logger.info("At the fetchAllUserTransactionApi ", userDetails);
        const response = await transactionService.fetchAllTransactionOfUser(
          userDetails
        );
        resolve(
          formatJSONResponse(
            response != null ? HTTP.SUCCESS : HTTP.BAD_REQUEST,
            response != null
              ? "User Transaction Data fetched Successfully"
              : "User or Account or Transaction Doesn't Exist in the System",
            response
          )
        );
      } catch (err) {
        reject(formatErrorJSONResponse(HTTP.SYSTEM_ERROR, err.message, err));
      }
    });
  }
}
export const handler = fetchAllUserTransactionApi.handler;
