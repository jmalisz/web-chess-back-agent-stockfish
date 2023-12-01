import { Codec, connect, JSONCodec } from "nats";

import { NATS_URL } from "@/config/env.js";
import { logger } from "@/middlewares/createLogMiddleware.js";

import { registerEmitterAgentMoveCalculated } from "./emitters/registerEmitterAgentMove.js";
import { registerListenerAgentCalculateMove } from "./listeners/registerListenerAgentMove.js";
import { decorateNatsCommunication } from "./middlewares/decorateNatsCommunication.js";

export const jsonCodec: Codec<Record<string, unknown>> = JSONCodec();

export const connectToNats = async () => {
  try {
    const natsClient = await connect({ servers: NATS_URL, waitOnFirstConnect: true });
    decorateNatsCommunication(natsClient, jsonCodec);

    // Listeners
    const listenAgentCalculateMove = registerListenerAgentCalculateMove(natsClient, jsonCodec);

    // Emitters
    const emitAgentMoveCalculated = registerEmitterAgentMoveCalculated(natsClient, jsonCodec);

    return {
      // Listeners
      listenAgentCalculateMove,
      // Emitters
      emitAgentMoveCalculated,
    };
  } catch (error) {
    logger.error(error);

    throw error;
  }
};

export type EventHandlers = Awaited<ReturnType<typeof connectToNats>>;
