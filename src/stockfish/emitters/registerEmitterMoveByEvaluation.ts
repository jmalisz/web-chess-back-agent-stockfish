import { Readable, Writable } from "node:stream";

import { Chess } from "chess.js";

import { MAX_ELO } from "@/stockfish/config/constants.js";
import { chessEngineLogger } from "@/stockfish/config/logger.js";
import { chessEngineCheckAdvantage } from "@/stockfish/utils/chessEngineCheckAdvantage.js";
import { chessEngineCheckReadiness } from "@/stockfish/utils/chessEngineCheckReadiness.js";
import { findClosestNumbersBy } from "@/stockfish/utils/findClosestNumbers.js";
import { flushReadable } from "@/stockfish/utils/flushReadable.js";
import { getRandomInt } from "@/stockfish/utils/getRandomInt.js";

const PREFERRED_MOVES_AMOUNT = 3;

type MoveAdvantage = {
  move: string;
  advantage: number;
};

// Adjust chess engine strength based on perceived advantage
const chessEngineCalculateMove = async (stdin: Writable, stdout: Readable, chess: Chess) => {
  const possibleMoves = chess.moves();
  const possibleMovesPerceivedChanceOfVictory: MoveAdvantage[] = [];
  for (const move of possibleMoves) {
    chessEngineLogger.info(possibleMoves.length);
    stdin.write("ucinewgame\n");

    // check if chess-engine is ready to calculate move
    // eslint-disable-next-line no-await-in-loop
    await chessEngineCheckReadiness(stdin, stdout);

    chess.move(move);
    const newPositionFen = chess.fen();

    // Load position to engine
    stdin.write(`position fen ${newPositionFen}\n`);

    stdin.write("go depth 1\n");

    // eslint-disable-next-line no-await-in-loop
    const advantage = await new Promise<number>((resolve, reject) => {
      const calculateMoveAdvantage = (data: unknown) => {
        const perceivedChanceOfVictory = chessEngineCheckAdvantage(data);
        chessEngineLogger.info(perceivedChanceOfVictory);
        if (perceivedChanceOfVictory === undefined) return;

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

    possibleMovesPerceivedChanceOfVictory.push({ move, advantage });
    chess.undo();
  }

  possibleMovesPerceivedChanceOfVictory.sort((a, b) => a.advantage - b.advantage);
  const closestMoves = findClosestNumbersBy({
    searchedArray: possibleMovesPerceivedChanceOfVictory,
    // Allowing 1's creates more interesting opening moves
    searchedNumber: chess.moveNumber() > 5 ? 0.7 : 1,
    amount: PREFERRED_MOVES_AMOUNT,
    by: "advantage",
  });
  const selectedMove = closestMoves[getRandomInt(0, closestMoves.length - 1)]?.move;

  if (!selectedMove || typeof selectedMove !== "string") {
    throw new Error("Unable to choose any moves");
  }

  return selectedMove;
};

export const registerEmitterMoveByEvaluation = (stdin: Writable, stdout: Readable) => {
  const chess = new Chess();

  return async (positionFen: string) => {
    chess.load(positionFen);
    stdin.write(`setoption name UCI_Elo value ${MAX_ELO}\n`);

    const move = await chessEngineCalculateMove(stdin, stdout, chess);

    return move;
  };
};
