import { runMigrations } from "@smart-bot/db";
import { buildApp } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();

await runMigrations(config.DATABASE_URL, config.MIGRATIONS_DIR);
const app = await buildApp(config);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    await app.close();
    process.exit(0);
  });
}

await app.listen({ port: config.SERVER_PORT, host: config.SERVER_HOST });
