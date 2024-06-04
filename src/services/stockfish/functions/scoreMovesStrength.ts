import { Readable, Writable } from "node:stream";

import { Chess } from "chess.js";

import { MAX_ELO } from "@/services/stockfish/config/constants.js";
import { chessEngineCheckReadiness } from "@/services/stockfish/utils/chessEngineCheckReadiness.js";
import { chessEngineCheckScore } from "@/services/stockfish/utils/chessEngineCheckScore.js";
import { flushReadable } from "@/services/stockfish/utils/flushReadable.js";

type ScoreMovesProps = {
  chessInterface: Chess;
  stdin: Writable;
  stdout: Readable;
};

const scoreMoves = async ({ chessInterface, stdin, stdout }: ScoreMovesProps) => {
  const scoresList: number[] = [];

  const possibleMoves = chessInterface.moves();
  for (const move of possibleMoves) {
    stdin.write("ucinewgame\n");

    // check if chess-engine is ready to calculate move
    // eslint-disable-next-line no-await-in-loop
    await chessEngineCheckReadiness(stdin, stdout);

    chessInterface.move(move);
    const newPositionFen = chessInterface.fen();

    // Load position to engine
    stdin.write(`position fen ${newPositionFen}\n`);

    stdin.write("go depth 1\n");

    // eslint-disable-next-line no-await-in-loop
    const score = await new Promise<number>((resolve, reject) => {
      const calculateMoveAdvantage = (chessEngineOutput: unknown) => {
        const potentialScore = chessEngineCheckScore(chessEngineOutput);
        if (potentialScore === undefined) return;

        flushReadable(stdout);

        stdout.removeListener("data", calculateMoveAdvantage);
        resolve(potentialScore);
      };

      stdout.on("data", calculateMoveAdvantage);
      setTimeout(() => {
        stdout.removeListener("data", calculateMoveAdvantage);
        reject(new Error("chess-engine timed out waiting for calculateMoveAdvantage"));
      }, 3000);
    });

    scoresList.push(score);
    chessInterface.undo();
  }

  return scoresList;
};

type CalculateMoveByEvaluationProps = {
  chessInterface: Chess;
  positionFen: string;
  stdin: Writable;
  stdout: Readable;
};

// Adjust chess engine strength based on perceived advantage
export const scoreMovesStrength = async ({
  chessInterface,
  positionFen,
  stdin,
  stdout,
}: CalculateMoveByEvaluationProps) => {
  chessInterface.load(positionFen);
  stdin.write(`setoption name UCI_Elo value ${MAX_ELO}\n`);

  const scoredMovesList = await scoreMoves({ chessInterface, stdin, stdout });

  return scoredMovesList;
};
