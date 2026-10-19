import { readFileSync, writeFileSync } from "node:fs";
import type { Plugin } from "vite";

/**
 * palettesPlugin: in development the play page hands the palettes added in the
 * browser to the server, and the server writes them into src/lib/palettes.own.json,
 * so a palette composed in the picker is in the code the moment the page loads
 * and can be named as a default. the file is merged by id; nothing is removed.
 */
export function palettesPlugin(file: string): Plugin {
  return {
    name: "mathfr-palettes",
    configureServer(server) {
      server.middlewares.use("/__palettes", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          const incoming = JSON.parse(body) as { id: string }[];
          const current = JSON.parse(readFileSync(file, "utf8")) as { id: string }[];
          const merged = [...current.filter((p) => !incoming.some((q) => q.id === p.id)), ...incoming];
          const changed = JSON.stringify(merged) !== JSON.stringify(current);
          if (changed) {
            writeFileSync(file, JSON.stringify(merged, null, 2) + "\n");
            server.config.logger.info(`palettes: ${incoming.map((p) => p.id).join(", ")} written to palettes.own.json`, { timestamp: true });
          }
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ written: changed }));
        });
      });
    },
  };
}
