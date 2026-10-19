/**
 * a vite plugin for development only: the theme builder page saves and loads
 * its versions through it, as files in the themes folder. it is never part of
 * a build, so the product has no such endpoint and no themes.
 *
 *   GET  /__themes            every saved theme, by name
 *   PUT  /__themes/<name>     save one, the body being the theme as json
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { parseTheme, validName } from "../src/theme/theme.ts";

const ROUTE = "/__themes";
const MOST_BYTES = 20_000;

export function themesPlugin(dir: string): Plugin {
  return {
    name: "themes-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(ROUTE, (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(body));
        };
        if (req.method === "GET") {
          if (!existsSync(dir)) return send(200, []);
          const out = [];
          for (const file of readdirSync(dir).sort()) {
            if (!file.endsWith(".json")) continue;
            const theme = parseTheme(JSON.parse(readFileSync(join(dir, file), "utf8")));
            if (theme) out.push(theme);
          }
          return send(200, out);
        }
        if (req.method === "PUT") {
          const name = (req.url ?? "").replace(/^\//, "");
          if (!validName(name)) return send(400, { detail: "The name is letters, digits and hyphens, up to forty" });
          const chunks: Buffer[] = [];
          let size = 0;
          req.on("data", (c: Buffer) => {
            size += c.length;
            if (size <= MOST_BYTES) chunks.push(c);
          });
          req.on("end", () => {
            if (size > MOST_BYTES) return send(413, { detail: "Too large for a theme" });
            let theme;
            try {
              theme = parseTheme(JSON.parse(Buffer.concat(chunks).toString("utf8")));
            } catch {
              theme = null;
            }
            if (!theme || theme.name !== name) return send(400, { detail: "Not a theme, or the name does not match" });
            mkdirSync(dir, { recursive: true });
            writeFileSync(join(dir, `${name}.json`), JSON.stringify(theme, null, 2) + "\n");
            return send(200, theme);
          });
          return;
        }
        send(405, { detail: "GET or PUT" });
      });
    },
  };
}
