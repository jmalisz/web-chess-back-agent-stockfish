import { Chess } from "chess.js";

import { NatsEventHandlers } from "@/events/connectToNats.js";
import { ChessEngineEventHandlers } from "@/stockfish/initChessEngine.js";

type RegisterServiceCalculateMoveProps = {
  listenCalculateMoveEngineStrength: NatsEventHandlers["listenCalculateMoveEngineStrength"];
  listenCalculateMoveEvaluation: NatsEventHandlers["listenCalculateMoveEvaluation"];
  emitMoveCalculated: NatsEventHandlers["emitMoveCalculated"];
  moveByEngineStrength: ChessEngineEventHandlers["moveByEngineStrength"];
  moveByEvaluation: ChessEngineEventHandlers["moveByEvaluation"];
};

export const registerServiceCalculateMove = ({
  listenCalculateMoveEngineStrength,
  listenCalculateMoveEvaluation,
  emitMoveCalculated,
  moveByEngineStrength,
  moveByEvaluation,
}: RegisterServiceCalculateMoveProps) => {
  const chess = new Chess();

  listenCalculateMoveEngineStrength(async ({ gameId, gamePositionPgn }) => {
    chess.loadPgn(gamePositionPgn);
    const move = await moveByEngineStrength(chess.fen());
    chess.move(move);
    emitMoveCalculated({ gameId, gamePositionPgn: chess.pgn() });
  });

  listenCalculateMoveEvaluation(async ({ gameId, gamePositionPgn }) => {
    chess.loadPgn(gamePositionPgn);
    const move = await moveByEvaluation(chess.fen());
    chess.move(move);
    emitMoveCalculated({ gameId, gamePositionPgn: chess.pgn() });
  });
};
