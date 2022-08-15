export const formatJSONResponse = (
  statusCode: number,
  message: string,
  response: any
): any => {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify({ statusCode, message, response })
  };
};

export const formatErrorJSONResponse = (
  statusCode: number,
  message: string,
  error: any
): any => {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify({ statusCode, message, error })
  };
};
