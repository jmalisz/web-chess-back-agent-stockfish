import { Chess } from "chess.js";
import { random } from "lodash-es";

import { EventHandlers } from "@/events/connectToNats.js";

export const registerServiceCalculateNextMove = (
  listenAgentCalculateMove: EventHandlers["listenAgentCalculateMove"],
  emitAgentMoveCalculated: EventHandlers["emitAgentMoveCalculated"],
) => {
  const chess = new Chess();

  listenAgentCalculateMove(({ gameId, gamePositionPgn }) => {
    chess.loadPgn(gamePositionPgn);
    const potentialMoves = chess.moves();
    const move = potentialMoves[random(potentialMoves.length - 1)];

    if (!move) throw new Error("Illegal move by agent");
    chess.move(move);

    emitAgentMoveCalculated({ gameId, gamePositionPgn: chess.pgn() });
  });
};
