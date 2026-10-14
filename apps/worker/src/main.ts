import { PgBoss } from "pg-boss";
import { loadConfig } from "./config";
import { registerHeartbeat } from "./jobs/heartbeat";

const config = loadConfig();

const boss = new PgBoss(config.DATABASE_URL);
boss.on("error", (err) => console.error("[worker] pg-boss error", err));

await boss.start();
await registerHeartbeat(boss);
console.log("[worker] started");

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    await boss.stop();
    process.exit(0);
  });
}
