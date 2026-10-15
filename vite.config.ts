import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Vite plugin to handle secure server-side synchronization endpoints.
 * Never exposes server environment variables or private keys to the browser bundle.
 */
function serverSyncPlugin(): Plugin {
  return {
    name: "server-sync-plugin",
    configureServer(server) {
      server.middlewares.use("/api/sync", async (req, res, next) => {
        if (req.method === "POST") {
          try {
            const syncScriptUrl = pathToFileURL(path.resolve("./scripts/sync-data.mjs")).href;
            const { runServerSync } = await import(/* @vite-ignore */ syncScriptUrl);
            const telemetry = await runServerSync();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(telemetry));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: message, status: "FAILED" }));
          }
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/sync", async (req, res, next) => {
        if (req.method === "POST") {
          try {
            const syncScriptUrl = pathToFileURL(path.resolve("./scripts/sync-data.mjs")).href;
            const { runServerSync } = await import(/* @vite-ignore */ syncScriptUrl);
            const telemetry = await runServerSync();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(telemetry));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: message, status: "FAILED" }));
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), serverSyncPlugin()],
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          icons: ["lucide-react"]
        }
      }
    }
  }
});
