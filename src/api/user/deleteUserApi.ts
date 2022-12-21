import { APIGatewayEvent, Handler, APIGatewayProxyResult } from "aws-lambda";
import { formatErrorJSONResponse } from "../../utils/ResponseUtils";
import logger from "../../utils/logger";
import { HTTP } from "../../constants/http.constants";

import { formatJSONResponse } from "../../utils/ResponseUtils";
import userService from "../../services/user/user.service";
import User from "../../models/userInput.model";

export class deleteUserApi {
  /*
  This lambda function will return basic details of the User
  */
  static async handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const userDeatils: User = JSON.parse(event.body);
        logger.info("At the getUserAPI ", userDeatils);
        if (!userDeatils.userId) {
          resolve(
            formatJSONResponse(
              HTTP.BAD_REQUEST,
              "user Id Empty",
              {}
            )
          );
        }
        const response = await userService.deleteUser(userDeatils);
        resolve(
          formatJSONResponse(
            response != null ? HTTP.SUCCESS : HTTP.BAD_REQUEST,
            response != null
              ? "User Data Deleted Successfully"
              : "Failed to Delete User Data, Since User doesn't exist",
            response
          )
        );
      } catch (err) {
        reject(formatErrorJSONResponse(HTTP.SYSTEM_ERROR, err.message, err));
      }
    });
  }
}
export const handler = deleteUserApi.handler;
