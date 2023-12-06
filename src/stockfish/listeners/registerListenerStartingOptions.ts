import { ChildProcess } from "node:child_process";
import { Writable } from "node:stream";

import { chessEngineLogger } from "@/stockfish/config/logger.js";

export const registerListenerStartingOptions = (chessEngine: ChildProcess, stdin: Writable) => {
  // Setup engine starting options
  chessEngine.on("spawn", () => {
    chessEngineLogger.info("chess-engine spawned");

    // https://disservin.github.io/stockfish-docs/pages/Commands.html
    stdin.write("uci\n");
    stdin.write("setoption name UCI_LimitStrength value true\n");
    stdin.write("setoption name Move Overhead value 300\n");
  });
};
