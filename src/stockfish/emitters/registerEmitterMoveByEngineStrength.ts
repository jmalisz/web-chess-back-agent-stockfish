import { Readable, Writable } from "node:stream";

import { MAX_ELO, MIN_ELO } from "@/stockfish/config/constants.js";
import { chessEngineCheckAdvantage } from "@/stockfish/utils/chessEngineCheckAdvantage.js";
import { chessEngineCheckReadiness } from "@/stockfish/utils/chessEngineCheckReadiness.js";
import { flushReadable } from "@/stockfish/utils/flushReadable.js";
import { linearInterpolation } from "@/stockfish/utils/linearInterpolation.js";

// Adjust chess engine strength based on perceived advantage
const chessEngineAdjustStrength = (stdin: Writable, stdout: Readable) => {
  stdin.write("go depth 1\n");

  return new Promise<void>((resolve, reject) => {
    const adjustStrength = (data: unknown) => {
      const perceivedChanceOfVictory = chessEngineCheckAdvantage(data);
      if (perceivedChanceOfVictory === undefined) return;

      // Reversed, because the ELO should be lower for higher chances of victory
      const newElo = linearInterpolation(MAX_ELO, MIN_ELO, perceivedChanceOfVictory);
      stdin.write(`setoption name UCI_Elo value ${newElo}\n`);

      flushReadable(stdout);

      stdout.removeListener("data", adjustStrength);
      resolve();
    };

    stdout.on("data", adjustStrength);
    setTimeout(() => {
      stdout.removeListener("data", adjustStrength);
      reject(new Error("chess-engine timed out waiting for adjustStrength"));
    }, 3000);
  });
};

const chessEngineCalculateMove = (stdin: Writable, stdout: Readable) => {
  stdin.write("go depth 12\n");

  return new Promise<string>((resolve, reject) => {
    const checkBestMove = (data: unknown) => {
      const stringifiedData = String(data);

      const matchedBestMove = stringifiedData.includes("bestmove");
      if (!matchedBestMove) return;

      const calculatedMove = stringifiedData.split(" ")[1];

      if (!calculatedMove) {
        reject(new Error("chess-engine checkBestMove is undefined"));
        return;
      }

      stdout.removeListener("data", checkBestMove);
      resolve(calculatedMove);
    };

    stdout.on("data", checkBestMove);
    setTimeout(() => {
      stdout.removeListener("data", checkBestMove);
      reject(new Error("chess-engine timed out waiting for checkBestMove"));
    }, 3000);
  });
};

export const registerEmitterMoveByEngineStrength =
  (stdin: Writable, stdout: Readable) => async (positionFen: string) => {
    stdin.write("ucinewgame\n");
    // check if chess-engine is ready to calculate move
    await chessEngineCheckReadiness(stdin, stdout);

    // Load position to engine
    stdin.write(`position fen ${positionFen}\n`);

    await chessEngineAdjustStrength(stdin, stdout);

    return chessEngineCalculateMove(stdin, stdout);
  };
