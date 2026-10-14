// Builds and launches the mobile app on a simulator/emulator. Called by the mobile package's
// `dev` and `release` scripts (so `pnpm dev:mobile` / `pnpm prod:mobile` end up here).
//   macOS        → iOS Simulator
//   Linux/Windows → Android emulator
// Override with MOBILE_PLATFORM=android|ios.
import { join } from "node:path";
import { prepareAndroid } from "./android.mjs";
import { fail, loadEnv, log, ROOT, run } from "./lib.mjs";

const mode = process.argv[2];
if (mode !== "dev" && mode !== "release") fail("Usage: node scripts/mobile.mjs dev|release");

loadEnv();
const platform = process.env.MOBILE_PLATFORM || (process.platform === "darwin" ? "ios" : "android");
if (platform !== "android" && platform !== "ios")
  fail(`MOBILE_PLATFORM must be android or ios, got "${platform}"`);
if (platform === "ios" && process.platform !== "darwin") fail("iOS builds need macOS with Xcode.");

// The emulator reaches the host machine at 10.0.2.2; the iOS Simulator shares the host's network.
const host = platform === "android" ? "10.0.2.2" : "localhost";
const port = mode === "dev" ? process.env.SERVER_PORT || 3000 : process.env.PROD_PORT || 8080;
const env = platform === "android" ? await prepareAndroid() : { ...process.env };
env.EXPO_PUBLIC_API_URL ||= `http://${host}:${port}`;

const args = ["exec", "expo", `run:${platform}`];
if (mode === "release") {
  // JS is bundled into the binary, so no Metro server.
  args.push(
    ...(platform === "android" ? ["--variant", "release"] : ["--configuration", "Release"]),
    "--no-bundler",
  );
}

log(`${mode === "dev" ? "Dev" : "Release"} build for ${platform}, API at ${env.EXPO_PUBLIC_API_URL}`);
await run("pnpm", args, { cwd: join(ROOT, "apps/mobile"), env });
