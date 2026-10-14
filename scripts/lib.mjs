// Shared helpers for the root dev/prod scripts. Plain Node, no dependencies, so they work
// before `pnpm install` and on Linux, macOS and Windows alike.
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const ENV_FILE = join(ROOT, ".env");
const isWindows = process.platform === "win32";

export function log(msg) {
  console.log(`\x1b[34m›\x1b[0m ${msg}`);
}

export function fail(msg) {
  console.error(`\x1b[31m✗\x1b[0m ${msg}`);
  process.exit(1);
}

/** Creates .env from .env.example if missing. Returns true if it was created. */
export function ensureEnvFile() {
  if (existsSync(ENV_FILE)) return false;
  copyFileSync(join(ROOT, ".env.example"), ENV_FILE);
  return true;
}

/** Loads the repo-root .env into process.env (existing variables win). */
export function loadEnv() {
  if (!existsSync(ENV_FILE)) fail("No .env found. Run `pnpm bootstrap` first.");
  process.loadEnvFile(ENV_FILE);
  return process.env;
}

/** Runs a command with inherited stdio. Resolves on exit code 0, exits the script otherwise. */
export function run(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: "inherit",
      shell: isWindows, // resolves pnpm.cmd / npx.cmd
      ...opts,
      env: { ...process.env, ...opts.env },
    });
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else process.exit(code ?? (signal ? 1 : 0));
    });
  });
}

/** Runs a command and returns its stdout ("" if it fails or isn't installed). */
export function capture(cmd, args = [], opts = {}) {
  const res = spawnSync(cmd, args, { encoding: "utf8", shell: isWindows, ...opts });
  return res.status === 0 ? res.stdout.trim() : "";
}

export function compose(file, args, opts) {
  return run("docker", ["compose", "-f", join("deploy", file), "--env-file", ".env", ...args], opts);
}

/** Starts the dev Postgres container and waits until it's healthy. */
export async function ensureDevDb() {
  log("Starting dev Postgres (deploy/compose.dev.yml)…");
  await compose("compose.dev.yml", ["up", "-d", "--wait"]);
}

/** Builds and starts the prod stack (Postgres + server serving the web app + worker). */
export async function prodUp() {
  log("Building and starting the prod stack (deploy/compose.yml)…");
  await compose("compose.yml", ["up", "-d", "--build", "--wait"]);
  log(`Prod stack is up: http://localhost:${process.env.PROD_PORT || 8080}`);
}
