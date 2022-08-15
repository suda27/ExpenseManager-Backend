import { APIGatewayEvent, Handler, APIGatewayProxyResult } from "aws-lambda";
import { formatErrorJSONResponse } from "../../utils/ResponseUtils";
import logger from "../../utils/logger";
import { HTTP } from "../../constants/http.constants";

import { formatJSONResponse } from "../../utils/ResponseUtils";
import userAccountService from "../../services/useraccount/user-account.service";
import UserAccount from "../../models/userAccount.model";
import User from "../../models/userInput.model";

export class fetchSingleUserAccountApi {
  /*
  This lambda function will return basic details of the User
  */
  static async handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return new Promise(async (resolve, reject) => {
      try {
         const userAccountDeatils: UserAccount = JSON.parse(event.body);
        logger.info("At the fetchSingleUserAccountApi ", userAccountDeatils);
        const response = await userAccountService.fetchSingleUserAccount(
          userAccountDeatils.accountID
        );
        resolve(
          formatJSONResponse(
            response != null ? HTTP.SUCCESS : HTTP.BAD_REQUEST,
            response != null
              ? "User Acount Fetched Successfully"
              : "User Account Do not Exist in the System",
            response
          )
        );
      } catch (err) {
        reject(formatErrorJSONResponse(HTTP.SYSTEM_ERROR, err.message, err));
      }
    });
  }
}
export const handler = fetchSingleUserAccountApi.handler;
