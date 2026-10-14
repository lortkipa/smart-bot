import fastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";

/** Serves the built web app and falls back to index.html for client-side routes. */
export async function staticPlugin(app: FastifyInstance, opts: { root: string }) {
  await app.register(fastifyStatic, { root: opts.root, wildcard: false });
  app.setNotFoundHandler((req, reply) => {
    if (req.method === "GET" && !req.url.startsWith("/api") && !req.url.startsWith("/ws")) {
      return reply.sendFile("index.html");
    }
    return reply.code(404).send({ error: "Not found" });
  });
}
