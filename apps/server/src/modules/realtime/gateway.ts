import websocket from "@fastify/websocket";
import { ClientMessage, type ServerMessage, WS_PATH } from "@smart-bot/shared";
import type { FastifyInstance } from "fastify";
import { version } from "../../version";

const PING_INTERVAL_MS = 15_000;

/** Realtime channel. Will carry chat streaming, task status and VM events. */
export async function realtimeGateway(app: FastifyInstance) {
  await app.register(websocket);

  app.get(WS_PATH, { websocket: true }, (socket, req) => {
    const send = (msg: ServerMessage) => socket.send(JSON.stringify(msg));
    req.log.info({ origin: req.headers.origin }, "ws connected");

    send({ type: "hello", serverVersion: version });
    const timer = setInterval(() => send({ type: "ping", time: new Date().toISOString() }), PING_INTERVAL_MS);

    socket.on("message", (raw) => {
      const parsed = ClientMessage.safeParse(JSON.parse(raw.toString()));
      if (!parsed.success) req.log.warn("ws: invalid client message");
    });
    socket.on("close", () => {
      clearInterval(timer);
      req.log.info("ws disconnected");
    });
  });
}
