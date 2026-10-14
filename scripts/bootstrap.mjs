// One-time setup: `pnpm bootstrap`. Safe to re-run.
import { ensureDevDb, ensureEnvFile, loadEnv, log, run } from "./lib.mjs";

const [major] = process.versions.node.split(".").map(Number);
if (major < 22) {
  console.error(`Node ${process.versions.node} is too old; Smart Bot needs Node 22 or newer.`);
  process.exit(1);
}

if (ensureEnvFile()) log("Created .env from .env.example");
loadEnv();

log("Installing dependencies…");
await run("pnpm", ["install"]);
await ensureDevDb();
log("Applying database migrations…");
await run("pnpm", ["db:migrate"]);

log("Ready. Next: `pnpm dev:web`, `pnpm dev:desktop` or `pnpm dev:mobile` (see README.md).");
