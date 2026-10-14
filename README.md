# Smart Bot

Open source, always-on AI agent platform. Agents run in the cloud around the clock, on a Linux desktop VM per user, and you can watch or take over from web, desktop, or mobile. See [CLAUDE.md](CLAUDE.md) for the design.

> Status: scaffold. Every app runs. The clients show the sign-in flow, backed by a mock auth client until the server implements auth (the mock's verification code is `123456`). Agents and VMs are not built yet.

## Prerequisites

| For | You need |
| --- | --- |
| Everything | Node.js 22+, pnpm 11 (`npm i -g pnpm`), Docker with Compose v2 |
| Desktop | Rust (stable) and the [Tauri system dependencies](https://v2.tauri.app/start/prerequisites/) for your OS |
| Mobile on Linux/Windows | Android Studio (or the SDK command-line tools) with the Emulator, Platform-Tools, one system image (e.g. `system-images;android-36;google_apis;x86_64`), and a JDK 17–21 |
| Mobile on macOS | Xcode with an iOS Simulator runtime |

The scripts find the Android SDK (`ANDROID_HOME`, else the Android Studio default location) and a JDK 17–21 on their own, even if neither is on `PATH`. Android builds fail on newer JDKs, so if your default `java` is newer, they pick an installed 17–21 instead.

## Quick start

```bash
pnpm bootstrap
```

Installs dependencies, creates `.env` from `.env.example`, starts the dev Postgres container, and applies migrations. Safe to re-run.

```bash
pnpm dev:web
```

Then open http://localhost:5173.

## Commands

The platform follows your machine. Desktop is always the native app for your OS. Mobile runs on the **iOS Simulator on macOS** and on the **Android emulator on Linux and Windows**.

### Dev (hot reload)

| Command | Runs |
| --- | --- |
| `pnpm dev` | Backend only: Postgres (Docker), API server and worker (watch mode) |
| `pnpm dev:web` | Backend + web app at http://localhost:5173 |
| `pnpm dev:desktop` | Backend + desktop app in a native window (`tauri dev`, reloads with the web app) |
| `pnpm dev:mobile` | Backend + mobile dev build on the simulator/emulator (boots it if needed), with fast refresh |

Every dev command runs in one [turbo](https://turborepo.com) terminal UI with a pane per process. Press `Ctrl+C` to stop them all. The dev Postgres container keeps running; stop it with `docker compose -f deploy/compose.dev.yml down`.

### Prod (release builds)

Prod commands build and start the Docker stack first (Postgres, the API server serving the built web app, and the worker) on http://localhost:8080, then build the client in release mode and point it at that stack.

| Command | Runs |
| --- | --- |
| `pnpm prod:up` | The Docker prod stack only |
| `pnpm prod:web` | Prod stack; the web app is at http://localhost:8080 |
| `pnpm prod:desktop` | Prod stack + release build of the desktop app, then launches it. Installers go to `apps/desktop/src-tauri/target/release/bundle/` (AppImage, deb and rpm on Linux; app and dmg on macOS; msi and exe on Windows) |
| `pnpm prod:mobile` | Prod stack + release build installed and launched on the simulator/emulator |
| `pnpm prod:logs` | Follow logs of the prod stack |
| `pnpm prod:down` | Stop the prod stack (data stays in the `smart-bot_pgdata` volume) |

### Other

| Command | Does |
| --- | --- |
| `pnpm typecheck` | Type-check every package |
| `pnpm lint` / `pnpm format` | Biome lint and format check / apply fixes |
| `pnpm build` | Build server, worker and web (desktop and mobile build through the prod commands) |
| `pnpm db:generate` | Generate a SQL migration from changes in `packages/db/src/schema` |
| `pnpm db:migrate` | Apply migrations to the dev database (the server also applies them on start) |
| `pnpm db:studio` | Open Drizzle Studio on the dev database |

## How the pieces connect

| | Dev | Prod |
| --- | --- | --- |
| Postgres | Docker, `localhost:54320` | Docker, internal only |
| API + WebSocket | host, `localhost:3000` | Docker, `localhost:8080` |
| Web | Vite on `:5173`, proxies `/api` and `/ws` to `:3000` | Served by the API server on `:8080` (same origin) |
| Desktop | Window loads the Vite dev server | Bundled web build, calls `http://localhost:8080` |
| Android emulator | `http://10.0.2.2:3000` (the emulator's alias for your machine) | `http://10.0.2.2:8080` |
| iOS Simulator | `http://localhost:3000` | `http://localhost:8080` |

All clients use the same client SDK from `packages/shared`, so the API contract (zod schemas) is defined once.

## Layout

```
apps/
  server/      Fastify API + WebSocket gateway; serves the web build in prod
  worker/      Agent runtime (pg-boss jobs); runs a heartbeat job for now
  web/         React + Vite
  desktop/     Tauri 2 shell around the web app
  mobile/      Expo (React Native) app, built as a dev client
  vm-manager/  Firecracker VM lifecycle on the host (placeholder)
  vm-daemon/   Agent action executor inside each VM (placeholder)
packages/
  shared/      zod schemas, WebSocket message types, client SDK
  db/          Drizzle schema, migrations, DB client
deploy/        compose.yml (prod), compose.dev.yml (dev Postgres), Dockerfile
scripts/       Node scripts behind the root commands (bootstrap, dev, prod, mobile, android)
images/vm/     VM root filesystem and kernel build (placeholder)
brand/         Logo and icon sources
```

Workspace packages (`packages/*`) ship TypeScript source with no build step. Vite, Metro and tsx read it directly, and the server and worker bundle it into their production builds.

## Configuration

All settings live in the root `.env` (created from [.env.example](.env.example)):

| Variable | Default | Used for |
| --- | --- | --- |
| `POSTGRES_PORT` | `54320` | Host port of the dev database |
| `DATABASE_URL` | `postgres://smartbot:smartbot@localhost:54320/smartbot` | Server, worker and Drizzle Kit in dev |
| `SERVER_PORT` | `3000` | Dev API server |
| `PROD_PORT` | `8080` | Published port of the prod stack |
| `CORS_ORIGINS` | Tauri origins | Extra origins allowed to call the API |
| `LOG_LEVEL` | `info` | Server log level |

Overrides for one run:

| Variable | Effect |
| --- | --- |
| `MOBILE_PLATFORM=android` / `ios` | Use Android on a Mac (or force a platform) |
| `ANDROID_AVD=<name>` | Boot this emulator instead of `SmartBot_Pixel` (which is created on first run from your newest system image) |
| `EXPO_PUBLIC_API_URL=<url>` | Point the mobile app at another server, e.g. a physical phone on your LAN |
| `VITE_API_URL=<url>` | Point a desktop release build at another server |

## Troubleshooting

- **Port already in use.** Change `SERVER_PORT`, `PROD_PORT` or `POSTGRES_PORT` in `.env` (and `DATABASE_URL` to match).
- **Android build fails with a Java or Gradle version error.** Install JDK 21 or set `JAVA_HOME` to a JDK 17–21.
- **Emulator won't start on Linux.** Your user needs access to `/dev/kvm` (usually by joining the `kvm` group).
- **Mobile app config changes don't apply.** `android/` and `ios/` are generated from `apps/mobile/app.config.ts` and git-ignored. Regenerate them with `pnpm --filter @smart-bot/mobile exec expo prebuild --clean`.
- **Blank or flickering desktop window on Linux (often NVIDIA + Wayland).** Run with `WEBKIT_DISABLE_DMABUF_RENDERER=1`.
- **First runs are slow.** The first desktop build compiles about 400 Rust crates, and the first mobile build runs a full Gradle build. Later runs are incremental.

The macOS/iOS and Windows paths are wired up but have only been tested on Linux so far.
