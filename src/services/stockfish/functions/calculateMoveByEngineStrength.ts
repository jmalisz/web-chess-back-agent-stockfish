import { Readable, Writable } from "node:stream";

import { chessEngineCheckReadiness } from "@/services/stockfish/utils/chessEngineCheckReadiness.js";
import { flushReadable } from "@/services/stockfish/utils/flushReadable.js";

const calculateMove = (stdin: Writable, stdout: Readable) => {
  stdin.write("go depth 12\n");

  return new Promise<string>((resolve, reject) => {
    const calculateMoveListener = (data: unknown) => {
      const stringifiedData = String(data);

      const matchedBestMove = stringifiedData.includes("bestmove");
      if (!matchedBestMove) return;

      const calculatedMove = stringifiedData.split(" ")[1];

      if (!calculatedMove) {
        reject(new Error("chess-engine checkBestMove is undefined"));
        return;
      }

      stdout.removeListener("data", calculateMoveListener);
      resolve(calculatedMove);
    };

    stdout.on("data", calculateMoveListener);
    setTimeout(() => {
      stdout.removeListener("data", calculateMoveListener);
      reject(new Error("chess-engine timed out waiting for checkBestMove"));
    }, 3000);
  });
};

type CalculateMoveByEngineStrength = {
  elo: number;
  positionFen: string;
  stdin: Writable;
  stdout: Readable;
};

export const calculateMoveByEngineStrength = async ({
  elo,
  positionFen,
  stdin,
  stdout,
}: CalculateMoveByEngineStrength) => {
  stdin.write("ucinewgame\n");
  // check if chess-engine is ready to calculate move
  await chessEngineCheckReadiness(stdin, stdout);

  // Load position to engine
  stdin.write(`position fen ${positionFen}\n`);
  // Adjust engine strength
  stdin.write(`setoption name UCI_Elo value ${elo}\n`);
  flushReadable(stdout);

  return calculateMove(stdin, stdout);
};
