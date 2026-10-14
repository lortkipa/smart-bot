import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  // Ports come from the repo-root .env shared with the backend.
  const rootEnv = loadEnv(mode, "../..", "");
  const api = `http://localhost:${rootEnv.SERVER_PORT || 3000}`;

  // A desktop release build is served from tauri://, not by the API server, so it needs an
  // absolute API URL. Default to the local prod stack; override with VITE_API_URL.
  const isDesktopBuild = command === "build" && !!process.env.TAURI_ENV_PLATFORM;
  const apiUrl =
    process.env.VITE_API_URL ??
    (isDesktopBuild ? `http://localhost:${rootEnv.PROD_PORT || 8080}` : undefined);

  return {
    plugins: [react()],
    define: apiUrl ? { "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl) } : {},
    server: {
      port: 5173,
      strictPort: true, // the desktop shell expects this exact port
      proxy: {
        "/api": api,
        "/ws": { target: api, ws: true },
      },
    },
  };
});
