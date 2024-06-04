import { Chess } from "chess.js";

import { CallbackProps } from "@/events/connectToNats.js";
import { gameDataSchema } from "@/models/GameData.js";
import { stockfishControllerFactory } from "@/services/stockfish/stockfish.js";

const payloadSchema = gameDataSchema;

export const calculateMoveEngineStrengthFactory = () => {
  const stockfishController = stockfishControllerFactory();
  const chess = new Chess();

  return async ({ natsClient, jsonCodec, message }: CallbackProps) => {
    const { elo, gameId, gamePositionPgn } = payloadSchema.parse(jsonCodec.decode(message.data));

    chess.loadPgn(gamePositionPgn);
    const positionFen = chess.fen();
    const move = await stockfishController.calculateMoveByEngineStrength(elo, positionFen);
    chess.move(move);

    natsClient.publish(
      "agent.moveCalculated",
      jsonCodec.encode({ gameId, gamePositionPgn: chess.pgn() }),
    );
  };
};
