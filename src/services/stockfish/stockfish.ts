import { fork } from "node:child_process";
import path from "node:path";

import { Chess } from "chess.js";

import { chessEngineLogger } from "./config/logger.js";
import { calculateMoveByEngineStrength } from "./functions/calculateMoveByEngineStrength.js";
import { calculateMoveByEvaluation } from "./functions/calculateMoveByEvaluation.js";
import { scoreMovesStrength } from "./functions/scoreMovesStrength.js";
import { registerLogMiddleware } from "./middlewares/registerLogMiddleware.js";

const CHESS_ENGINE_PATH = path.join(
  process.cwd(),
  "node_modules",
  "stockfish",
  "src",
  "stockfish-nnue-16.js",
);

const controller = new AbortController();
const chessEngine = fork(CHESS_ENGINE_PATH, ["stockfish.js"], {
  stdio: "pipe",
  signal: controller.signal,
});
const { stdin, stdout } = registerLogMiddleware(chessEngine);
// Setup engine starting options
chessEngine.on("spawn", () => {
  chessEngineLogger.info("chess-engine spawned");

  // https://disservin.github.io/stockfish-docs/pages/Commands.html
  stdin.write("uci\n");
  stdin.write("setoption name UCI_LimitStrength value true\n");
  stdin.write("setoption name Move Overhead value 300\n");
});
const chessInterface = new Chess();

// There is a possibility of synchronization issues if chess engine would take a long time to respond
// In practice, chess engine responds much faster than what would be problematic
export const stockfishControllerFactory = () => ({
  stop: () => controller?.abort(),
  calculateMoveByEngineStrength: (elo: number, positionFen: string) =>
    calculateMoveByEngineStrength({
      elo,
      positionFen,
      stdin,
      stdout,
    }),
  calculateMoveByEvaluation: (positionFen: string) =>
    calculateMoveByEvaluation({ chessInterface, positionFen, stdin, stdout }),
  scoreMovesStrength: (positionFen: string) =>
    scoreMovesStrength({ chessInterface, positionFen, stdin, stdout }),
});

export type StockfishService = ReturnType<typeof stockfishControllerFactory>;
