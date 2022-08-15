import pino from "pino";

const logger = pino({
  level: process.env.IS_OFFLINE ? "debug" : "info",
  prettyPrint: process.env.NODE_ENV !== "production"
});

export default logger;
