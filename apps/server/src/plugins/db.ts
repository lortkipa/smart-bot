import { createDb } from "@smart-bot/db";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    database: ReturnType<typeof createDb>;
  }
}

export async function dbPlugin(app: FastifyInstance, opts: { url: string }) {
  const database = createDb(opts.url);
  app.decorate("database", database);
  app.addHook("onClose", () => database.close());
}
