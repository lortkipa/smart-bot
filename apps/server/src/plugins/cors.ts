import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

/** Same-origin requests (web) need no CORS; this allows the desktop webview and any extra origins. */
export async function corsPlugin(app: FastifyInstance, opts: { origins: string[] }) {
  await app.register(cors, { origin: opts.origins });
}
