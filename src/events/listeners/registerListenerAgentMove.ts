import { Codec, NatsConnection } from "nats";

import { GameData, gameDataSchema } from "@/models/GameData.js";

const SUBJECT = "agent.stockfish.calculateMove";

type AgentCalculateMoveCallback = (payload: GameData) => Promise<void> | void;

export const registerListenerAgentCalculateMove = (
  natsClient: NatsConnection,
  jsonCodec: Codec<Record<string, unknown>>,
) => {
  const subscription = natsClient.subscribe(SUBJECT);

  return (callback: AgentCalculateMoveCallback) => {
    // eslint-disable-next-line no-void
    void (async () => {
      for await (const message of subscription) {
        const agentMovePayload = gameDataSchema.parse(jsonCodec.decode(message.data));
        await callback(agentMovePayload);
      }
    })();
  };
};
