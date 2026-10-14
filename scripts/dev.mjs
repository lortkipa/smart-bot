// `pnpm dev[:web|:desktop|:mobile]`: dev Postgres in Docker, everything else on the host
// with hot reload, all in one turbo TUI.
import { ensureDevDb, fail, loadEnv, run } from "./lib.mjs";

const clients = {
  backend: [],
  web: ["@smart-bot/web"],
  desktop: ["@smart-bot/desktop"], // tauri dev starts the web dev server itself
  mobile: ["@smart-bot/mobile"], // picks iOS Simulator on macOS, Android emulator elsewhere
};

const target = process.argv[2] ?? "backend";
if (!(target in clients)) fail(`Unknown target "${target}". Use one of: ${Object.keys(clients).join(", ")}`);

loadEnv();
await ensureDevDb();

const turboDev = (packages, ui) =>
  run("pnpm", ["exec", "turbo", "run", "dev", `--ui=${ui}`, ...packages.map((p) => `--filter=${p}`)]);
const backend = ["@smart-bot/server", "@smart-bot/worker"];

if (process.stdout.isTTY) {
  await turboDev([...backend, ...clients[target]], "tui");
} else {
  // No terminal (IDE task runner, CI): turbo can't host Expo's interactive task, so stream
  // the backend through turbo and run the mobile dev script next to it.
  const mobile = target === "mobile";
  await Promise.all([
    turboDev(mobile ? backend : [...backend, ...clients[target]], "stream"),
    mobile && run("pnpm", ["--filter", "@smart-bot/mobile", "dev"]),
  ]);
}
