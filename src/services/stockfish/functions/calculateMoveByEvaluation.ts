import { Readable, Writable } from "node:stream";

import { Chess } from "chess.js";

import { logger } from "@/middlewares/createLogMiddleware.js";
import { MAX_ELO } from "@/services/stockfish/config/constants.js";
import { chessEngineCheckReadiness } from "@/services/stockfish/utils/chessEngineCheckReadiness.js";
import { chessEngineCheckScore } from "@/services/stockfish/utils/chessEngineCheckScore.js";
import { findClosestNumbersBy } from "@/services/stockfish/utils/findClosestNumbers.js";
import { flushReadable } from "@/services/stockfish/utils/flushReadable.js";
import { getRandomInt } from "@/services/stockfish/utils/getRandomInt.js";
import { inverseLinearInterpolation } from "@/services/stockfish/utils/inverseLinearInterpolation.js";

const PREFERRED_MOVES_AMOUNT = 3;

type MoveAdvantage = {
  move: string;
  advantage: number;
};

type ScoreMovesProps = {
  chessInterface: Chess;
  stdin: Writable;
  stdout: Readable;
};

const scoreMoves = async ({ chessInterface, stdin, stdout }: ScoreMovesProps) => {
  const scoredMovesList: MoveAdvantage[] = [];

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
    const advantage = await new Promise<number>((resolve, reject) => {
      const calculateMoveAdvantage = (chessEngineOutput: unknown) => {
        const score = chessEngineCheckScore(chessEngineOutput);
        if (score === undefined) return;
        const perceivedChanceOfVictory = inverseLinearInterpolation(0, 100, score);

        flushReadable(stdout);

        stdout.removeListener("data", calculateMoveAdvantage);
        resolve(perceivedChanceOfVictory);
      };

      stdout.on("data", calculateMoveAdvantage);
      setTimeout(() => {
        stdout.removeListener("data", calculateMoveAdvantage);
        reject(new Error("chess-engine timed out waiting for calculateMoveAdvantage"));
      }, 3000);
    });

    scoredMovesList.push({ move, advantage });
    chessInterface.undo();
  }

  return scoredMovesList;
};

type CalculateMoveByEvaluationProps = {
  chessInterface: Chess;
  positionFen: string;
  stdin: Writable;
  stdout: Readable;
};

// Adjust chess engine strength based on perceived advantage
export const calculateMoveByEvaluation = async ({
  chessInterface,
  positionFen,
  stdin,
  stdout,
}: CalculateMoveByEvaluationProps) => {
  chessInterface.load(positionFen);
  stdin.write(`setoption name UCI_Elo value ${MAX_ELO}\n`);

  const scoredMovesList = await scoreMoves({ chessInterface, stdin, stdout });
  scoredMovesList.sort((a, b) => a.advantage - b.advantage);
  logger.info({ scoredMovesList });

  const closestMoves = findClosestNumbersBy({
    searchedArray: scoredMovesList,
    // Allowing 1's creates more interesting opening moves
    searchedNumber: chessInterface.moveNumber() > 5 ? 0.7 : 1,
    amount: PREFERRED_MOVES_AMOUNT,
    by: "advantage",
  });
  const selectedMove = closestMoves[getRandomInt(0, closestMoves.length - 1)]?.move;

  if (!selectedMove || typeof selectedMove !== "string") {
    throw new Error("Unable to choose any moves");
  }

  return selectedMove;
};
