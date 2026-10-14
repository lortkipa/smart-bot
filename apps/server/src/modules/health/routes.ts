import type { HealthResponse } from "@smart-bot/shared";
import type { FastifyInstance } from "fastify";
import { version } from "../../version";

export async function healthRoutes(app: FastifyInstance) {
  // Polled by Docker healthchecks every few seconds, so keep it out of the info log.
  app.get("/api/health", { logLevel: "warn" }, async (): Promise<HealthResponse> => {
    let database: HealthResponse["database"] = "ok";
    try {
      await app.database.ping();
    } catch (err) {
      app.log.error({ err }, "database ping failed");
      database = "error";
    }
    return {
      status: database === "ok" ? "ok" : "degraded",
      version,
      database,
      time: new Date().toISOString(),
    };
  });
}
