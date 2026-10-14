# Builds the server (with the web app baked in) and the worker from the monorepo.
# Build context is the repo root: docker build -f deploy/Dockerfile --target server .

FROM node:24-slim AS base
RUN npm install -g pnpm@11.24.0
ENV CI=true

FROM base AS build
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile \
      --filter "@smart-bot/server..." --filter "@smart-bot/worker..." --filter "@smart-bot/web..."
RUN pnpm --filter @smart-bot/web --filter @smart-bot/server --filter @smart-bot/worker build
RUN pnpm --filter @smart-bot/server deploy --prod --legacy /out/server \
 && pnpm --filter @smart-bot/worker deploy --prod --legacy /out/worker

FROM node:24-slim AS server
WORKDIR /app
ENV NODE_ENV=production SERVER_PORT=3000 WEB_DIST=/app/web MIGRATIONS_DIR=/app/drizzle
COPY --from=build /out/server ./
COPY --from=build /repo/apps/web/dist ./web
COPY --from=build /repo/packages/db/drizzle ./drizzle
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --retries=20 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
USER node
CMD ["node", "dist/main.js"]

FROM node:24-slim AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out/worker ./
USER node
CMD ["node", "dist/main.js"]
