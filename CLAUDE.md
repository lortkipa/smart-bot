# Smart Bot

Open source, always-on AI agent platform. Agents run in the cloud 24/7, independent of the user's own devices.

> Status: planning. The repository is empty; this file describes the intended design. Update it as decisions change.

## Domain model

- **User**: an account on a multi-tenant Smart Bot server. Each user gets one dedicated cloud VM.
- **Workspace**: a user owns many workspaces. Each workspace has one **workspace bot**.
- **Workspace bot**: a manager agent. It talks with the user and creates, monitors, and coordinates tasks in its workspace.
- **Task**: its own chat with its own agent. Task agents do the actual work on the user's VM.
- **VM**: a Linux desktop VM shared by all of the user's agents. The user can watch it live or take control. Agents can ask the user to take control (log in, solve a CAPTCHA, approve something) and wait until control is handed back.

## Hard requirements

- **Multi-tenant.** One server hosts many users. Never let one user's data, VM, or agent reach another's. Scope every query and every VM operation by user.
- **Self-host first.** The first deployment target is a single home server via Docker Compose. Don't depend on managed cloud services, so the same setup can later move to a cloud provider.
- **Real VM isolation.** Agents run arbitrary code and browse untrusted sites, so each user's machine is a Firecracker microVM with its own kernel, not a container. The host must expose KVM (bare metal, or cloud instances with nested virtualization / `.metal`).
- **Agents outlive clients.** Agent runs live on the server, survive client disconnects and server restarts, and resume from persisted state.
- **OpenAI only** for LLMs (Responses API, including its computer-use model). Keep model calls behind one internal module anyway.
- **Platforms:** web, desktop (Linux, Windows, macOS), mobile (Android, iOS).

## Stack

TypeScript everywhere, in one pnpm + Turborepo monorepo.

| Part | Choice |
| --- | --- |
| API server | Node.js, Fastify, WebSockets for realtime (chat streaming, task status, VM events) |
| Agent workers | Separate Node process(es) running agent loops; jobs via pg-boss (Postgres-backed queue) |
| Database | PostgreSQL with Drizzle ORM |
| Web | React + Vite |
| Desktop | Tauri 2 wrapping the web app |
| Mobile | React Native (Expo) |
| VM runtime | Firecracker microVMs running a Linux desktop (Xfce + Chromium), managed by the `vm-manager` service. Each user has a persistent disk; idle VMs are snapshotted and stopped, then restored on demand |
| VM control | Small daemon inside each VM that executes agent actions (screenshot, mouse/keyboard, shell, files) |
| VM streaming | VNC inside the VM, proxied by the API server over WebSocket (noVNC on web/desktop, WebView on mobile) |
| Deployment | Docker Compose |

## Intended layout

```
apps/
  server/      # API + WebSocket gateway + VNC proxy
  worker/      # agent runtime (workspace bots, task agents)
  web/         # React app, also bundled by desktop
  desktop/     # Tauri shell
  mobile/      # Expo app
  vm-manager/  # creates, starts, snapshots, and restores Firecracker VMs on the host
  vm-daemon/   # runs inside each user VM
packages/
  shared/      # types, API schemas (zod), client SDK used by web/desktop/mobile
  db/          # Drizzle schema + migrations
images/
  vm/          # build for the VM's root filesystem and kernel
deploy/        # docker-compose and config
```

## Conventions

- API contracts are zod schemas in `packages/shared`; server and clients both import them. No hand-duplicated types.
- Agents never talk to a VM directly over the network; they go through the server's VM layer, which enforces ownership.
- Control of a VM is exclusive: either the agent or the user drives input at a time. Handover is an explicit state change that both sides see.
- Secrets (OpenAI keys, user credentials) never go into logs, prompts sent to clients, or the database in plaintext.
