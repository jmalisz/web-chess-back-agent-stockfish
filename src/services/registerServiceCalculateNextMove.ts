import { Chess } from "chess.js";

import { NatsEventHandlers } from "@/events/connectToNats.js";
import { ChessEngineEventHandlers } from "@/stockfish/initChessEngine.js";

type RegisterServiceCalculateNextMoveProps = {
  listenAgentCalculateMove: NatsEventHandlers["listenAgentCalculateMove"];
  emitAgentMoveCalculated: NatsEventHandlers["emitAgentMoveCalculated"];
  chessEngineCalculateMove: ChessEngineEventHandlers["chessEngineCalculateMove"];
};

export const registerServiceCalculateNextMove = ({
  listenAgentCalculateMove,
  emitAgentMoveCalculated,
  chessEngineCalculateMove,
}: RegisterServiceCalculateNextMoveProps) => {
  const chess = new Chess();

  listenAgentCalculateMove(async ({ gameId, gamePositionPgn }) => {
    chess.loadPgn(gamePositionPgn);
    const move = await chessEngineCalculateMove(chess.fen());
    chess.move(move);
    emitAgentMoveCalculated({ gameId, gamePositionPgn: chess.pgn() });
  });
};
