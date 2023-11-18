import dotenv from "dotenv";

dotenv.config();

const { NODE_ENV, LOG_LEVEL = "info", SERVICE_PATH = "/" } = process.env;

export { LOG_LEVEL, NODE_ENV, SERVICE_PATH };
