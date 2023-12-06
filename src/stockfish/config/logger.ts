import { logger } from "@/middlewares/createLogMiddleware.js";

// Allows logs to be better separated
export const chessEngineLogger = logger.child({
  name: "chess-engine",
});
