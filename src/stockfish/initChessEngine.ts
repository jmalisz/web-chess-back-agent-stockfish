import { fork } from "node:child_process";
import path from "node:path";

import { registerEmitterMoveByEngineStrength } from "./emitters/registerEmitterMoveByEngineStrength.js";
import { registerEmitterMoveByEvaluation } from "./emitters/registerEmitterMoveByEvaluation.js";
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

  // There is a possibility of synchronization issues if chess engine would take a long time to respond
  // In practice, chess engine responds much faster than what would be problematic
  // Emitters
  const moveByEngineStrength = registerEmitterMoveByEngineStrength(stdin, stdout);
  const moveByEvaluation = registerEmitterMoveByEvaluation(stdin, stdout);

  return {
    stop: () => controller.abort(),
    moveByEngineStrength,
    moveByEvaluation,
  };
};

export type ChessEngineEventHandlers = ReturnType<typeof initChessEngine>;
