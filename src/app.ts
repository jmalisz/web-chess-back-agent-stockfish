// eslint-disable-next-line simple-import-sort/imports, import/order
import { SERVICE_PATH } from "./config/env.js";

import express from "express";
import helmet from "helmet";

import { logger, createLogMiddleware } from "./middlewares/createLogMiddleware.js";
import { RequestError } from "./models/RequestError.js";
import { createErrorMiddleware } from "./middlewares/createErrorMiddleware.js";
import { connectToNats } from "./events/connectToNats.js";
import { registerServiceCalculateNextMove } from "./services/registerServiceCalculateNextMove.js";
import { initChessEngine } from "./stockfish/initChessEngine.js";

const app = express();

app.use(helmet());
app.use(express.json());

app.get(SERVICE_PATH, (_req, res) => {
  res.send("OK");
});

app.all("*", () => {
  throw new RequestError({ httpStatus: 404, code: "GENERAL", subcode: "NOT_FOUND" });
});

app.use(createLogMiddleware());
app.use(createErrorMiddleware());

const { chessEngineStop, chessEngineCalculateMove } = initChessEngine();
const eventHandlers = await connectToNats();
const httpServer = app.listen(3000, () => {
  logger.info("Express server is running at port 3000");
});
// TODO: This could be moved to loaders
registerServiceCalculateNextMove({
  listenAgentCalculateMove: eventHandlers.listenAgentCalculateMove,
  emitAgentMoveCalculated: eventHandlers.emitAgentMoveCalculated,
  chessEngineCalculateMove,
});

/* eslint-disable unicorn/no-process-exit */
const gracefulShutdown = () => {
  httpServer.close(() => {
    process.exit(1);
  });
  chessEngineStop();

  // If a graceful shutdown is not achieved after 1 second, shut down the process completely
  setTimeout(() => {
    // Exit immediately and generate a core dump file
    process.abort();
  }, 1000).unref();
  process.exit(1);
};
/* eslint-enable unicorn/no-process-exit */

process.on("uncaughtException", (err) => {
  logger.fatal(err, "Uncaught exception");
  gracefulShutdown();
});

process.on("unhandledRejection", (err) => {
  logger.fatal(err, "Uncaught rejection");
  gracefulShutdown();
});
