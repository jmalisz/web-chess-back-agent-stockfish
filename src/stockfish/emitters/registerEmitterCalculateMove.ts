import { Readable, Writable } from "node:stream";

import { chessEngineLogger } from "@/stockfish/config/logger.js";

const chessEngineCheckReadiness = async (stdin: Writable, stdout: Readable) => {
  stdin.write("isready\n");

  await new Promise<boolean>((resolve, reject) => {
    const checkIsReady = (data: unknown) => {
      const matchedReadyOk = String(data).includes("readyok");

      if (matchedReadyOk) {
        stdout.removeListener("data", checkIsReady);
        resolve(matchedReadyOk);
      }
    };

    stdout.on("data", checkIsReady);
    setTimeout(() => {
      stdout.removeListener("data", checkIsReady);
      reject(new Error("chess-engine timed out waiting for isReady"));
    }, 3000);
  });
};

const chessEngineCalculateMove = (stdin: Writable, stdout: Readable, positionFen: string) => {
  stdin.write(`position fen ${positionFen}\n`);
  stdin.write("go depth 12\n");

  return new Promise<string>((resolve, reject) => {
    const checkBestMove = (data: unknown) => {
      const stringifiedData = String(data);

      const matchedBestMove = stringifiedData.includes("bestmove");
      if (!matchedBestMove) return;

      const calculatedMove = stringifiedData.split(" ")[1];

      if (!calculatedMove) {
        reject(new Error("chess-engine calculatedMove is undefined"));
        return;
      }

      chessEngineLogger.info({ stringifiedData, calculatedMove });
      resolve(calculatedMove);
    };

    stdout.on("data", checkBestMove);
    setTimeout(() => {
      stdout.removeListener("data", checkBestMove);
      reject(new Error("chess-engine timed out waiting for calculatedMove"));
    }, 3000);
  });
};

// TODO: Check if this doesn't require critical section lock
export const registerEmitterCalculateMove =
  (stdin: Writable, stdout: Readable) => async (positionFen: string) => {
    stdin.write("ucinewgame\n");
    // check if chess-engine is ready to calculate move
    await chessEngineCheckReadiness(stdin, stdout);

    return chessEngineCalculateMove(stdin, stdout, positionFen);
  };
