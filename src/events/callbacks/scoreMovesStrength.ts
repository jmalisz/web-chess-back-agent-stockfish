import { Chess } from "chess.js";

import { validator } from "@/config/validators.js";
import { CallbackProps } from "@/events/connectToNats.js";
import { stockfishControllerFactory } from "@/services/stockfish/stockfish.js";

const payloadSchema = validator.string();

export const scoreMovesStrengthFactory = () => {
  const stockfishController = stockfishControllerFactory();
  const chess = new Chess();

  return async ({ jsonCodec, message }: CallbackProps) => {
    const gamePositionPgn = payloadSchema.parse(jsonCodec.decode(message.data));

    chess.loadPgn(gamePositionPgn);
    const positionFen = chess.fen();
    const scores = await stockfishController.scoreMovesStrength(positionFen);

    message.respond(jsonCodec.encode(scores));
  };
};
