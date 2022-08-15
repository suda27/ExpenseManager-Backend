import { APIGatewayEvent, Handler, APIGatewayProxyResult } from "aws-lambda";
import { formatErrorJSONResponse } from "../../utils/ResponseUtils";
import logger from "../../utils/logger";
import { HTTP } from "../../constants/http.constants";

import { formatJSONResponse } from "../../utils/ResponseUtils";

export class helloWorld {
  /*
  This lambda function will return basic details of the User
  */
  static async handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return new Promise(async (resolve, reject) => {
      logger.info(event);
      try {
        resolve(
          formatJSONResponse(HTTP.SUCCESS, "API Working", {
            result: "It's working"
          })
        );
      } catch (err) {
        reject(formatErrorJSONResponse(HTTP.SYSTEM_ERROR, err.message, err));
      }
    });
  }
}
export const handler = helloWorld.handler;
