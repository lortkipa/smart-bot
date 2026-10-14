import { z } from "zod";

/** WebSocket path on the API server. */
export const WS_PATH = "/ws";

/** Messages the server sends to clients. */
export const ServerMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hello"), serverVersion: z.string() }),
  z.object({ type: z.literal("ping"), time: z.string() }),
]);
export type ServerMessage = z.infer<typeof ServerMessage>;

/** Messages clients send to the server. */
export const ClientMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pong"), time: z.string() }),
]);
export type ClientMessage = z.infer<typeof ClientMessage>;
