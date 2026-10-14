// `pnpm prod:[up|web|desktop|mobile]`: production builds running against the Docker prod stack.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fail, loadEnv, log, prodUp, ROOT, run } from "./lib.mjs";

const target = process.argv[2] ?? "up";
const targets = ["up", "web", "desktop", "mobile"];
if (!targets.includes(target)) fail(`Unknown target "${target}". Use one of: ${targets.join(", ")}`);

loadEnv();
await prodUp();

if (target === "web") {
  log(`Open http://localhost:${process.env.PROD_PORT || 8080} — stop the stack with \`pnpm prod:down\`.`);
}

if (target === "desktop") {
  // Release build of the native app for this OS; installers land in src-tauri/target/release/bundle.
  await run("pnpm", ["--filter", "@smart-bot/desktop", "release"]);
  const bin = join(
    ROOT,
    "apps/desktop/src-tauri/target/release",
    process.platform === "win32" ? "smart-bot.exe" : "smart-bot",
  );
  if (!existsSync(bin)) fail(`Release binary not found at ${bin}`);
  log(`Launching ${bin}`);
  await run(bin);
}

if (target === "mobile") {
  await run("pnpm", ["--filter", "@smart-bot/mobile", "release"]);
}
