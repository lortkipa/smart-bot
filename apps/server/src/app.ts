import Fastify from "fastify";
import type { Config } from "./config";
import { healthRoutes } from "./modules/health/routes";
import { realtimeGateway } from "./modules/realtime/gateway";
import { corsPlugin } from "./plugins/cors";
import { dbPlugin } from "./plugins/db";
import { staticPlugin } from "./plugins/static";

export async function buildApp(config: Config) {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport: config.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
    },
  });

  // Plugins below are registered at the root (not encapsulated) so decorators are shared.
  await dbPlugin(app, { url: config.DATABASE_URL });
  await corsPlugin(app, { origins: config.CORS_ORIGINS });
  await realtimeGateway(app);
  await app.register(healthRoutes);
  if (config.WEB_DIST) await staticPlugin(app, { root: config.WEB_DIST });

  return app;
}
