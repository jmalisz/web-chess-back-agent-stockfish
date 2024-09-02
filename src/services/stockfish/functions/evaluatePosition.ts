import { Readable, Writable } from "node:stream";

import { MAX_ELO } from "@/services/stockfish/config/constants.js";
import { chessEngineCheckReadiness } from "@/services/stockfish/utils/chessEngineCheckReadiness.js";
import { chessEngineCheckScore } from "@/services/stockfish/utils/chessEngineCheckScore.js";
import { flushReadable } from "@/services/stockfish/utils/flushReadable.js";

type ScoreMovesProps = {
  positionFen: string;
  stdin: Writable;
  stdout: Readable;
};

const scorePosition = async ({ positionFen, stdin, stdout }: ScoreMovesProps) => {
  stdin.write("ucinewgame\n");

  // Check if chess-engine is ready to calculate move
  await chessEngineCheckReadiness(stdin, stdout);

  // Load position to engine
  stdin.write(`position fen ${positionFen}\n`);

  stdin.write("go depth 1\n");

  const score = await new Promise<number>((resolve, reject) => {
    const calculateScore = (chessEngineOutput: unknown) => {
      const potentialScore = chessEngineCheckScore(chessEngineOutput);
      if (potentialScore === undefined) return;

      flushReadable(stdout);

      stdout.removeListener("data", calculateScore);
      resolve(potentialScore);
    };

    stdout.on("data", calculateScore);
    setTimeout(() => {
      stdout.removeListener("data", calculateScore);
      reject(new Error("chess-engine timed out waiting for scorePosition"));
    }, 3000);
  });

  return score;
};

type EvaluatePositionProps = {
  positionFen: string;
  stdin: Writable;
  stdout: Readable;
};

// Score current chess position
export const evaluatePosition = async ({ positionFen, stdin, stdout }: EvaluatePositionProps) => {
  stdin.write(`setoption name UCI_Elo value ${MAX_ELO}\n`);

  const positionScore = await scorePosition({ positionFen, stdin, stdout });

  return positionScore;
};
