import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

function cmsSyncPlugin(): Plugin {
  return {
    name: "cms-sync-plugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = (req.url || "").split("?")[0];

        if (cleanUrl === "/api/cms-data" && req.method === "GET") {
          try {
            const publicPath = path.resolve(__dirname, "public/cms-data.json");
            if (fs.existsSync(publicPath)) {
              const raw = fs.readFileSync(publicPath, "utf8");
              res.writeHead(200, {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              });
              res.end(raw);
              return;
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: msg }));
            return;
          }
        }

        if (cleanUrl === "/api/save-cms-data" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk: Buffer) => {
            body += chunk.toString();
          });
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              if (!data || typeof data !== "object" || !data.siteInfo || !Array.isArray(data.exams)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Payload CMS invalide." }));
                return;
              }
              const formatted = JSON.stringify(data, null, 2);
              const publicPath = path.resolve(__dirname, "public/cms-data.json");
              const servicePath = path.resolve(__dirname, "src/shared/services/default-cms-data.json");
              const distPath = path.resolve(__dirname, "dist/cms-data.json");
              fs.writeFileSync(publicPath, formatted, "utf8");
              fs.writeFileSync(servicePath, formatted, "utf8");
              if (fs.existsSync(path.resolve(__dirname, "dist"))) {
                fs.writeFileSync(distPath, formatted, "utf8");
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, updatedAt: data.updatedAt }));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: msg }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cmsSyncPlugin()],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
});
