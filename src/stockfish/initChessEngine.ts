import { fork } from "node:child_process";
import path from "node:path";

import { registerEmitterCalculateMove } from "./emitters/registerEmitterCalculateMove.js";
import { registerListenerStartingOptions } from "./listeners/registerListenerStartingOptions.js";
import { registerLogMiddleware } from "./middlewares/createLogMiddleware.js";

const CHESS_ENGINE_PATH = path.join(
  process.cwd(),
  "node_modules",
  "stockfish",
  "src",
  "stockfish-nnue-16.js",
);

export const initChessEngine = () => {
  const controller = new AbortController();
  const chessEngine = fork(CHESS_ENGINE_PATH, ["stockfish.js"], {
    stdio: "pipe",
    signal: controller.signal,
  });

  const { stdin, stdout } = registerLogMiddleware(chessEngine);

  // Listeners
  registerListenerStartingOptions(chessEngine, stdin);

  // Emitters
  const chessEngineCalculateMove = registerEmitterCalculateMove(stdin, stdout);

  return {
    chessEngineStop: () => controller.abort(),
    chessEngineCalculateMove,
  };
};

export type ChessEngineEventHandlers = ReturnType<typeof initChessEngine>;
