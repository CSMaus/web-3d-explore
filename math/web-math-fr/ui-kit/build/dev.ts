/**
 * a vite plugin for development only, used by the kit's own dev server, by
 * storybook and by a consuming project's dev server.
 *
 * kitThemePlugin: when a script in the kit's config folder is saved, the theme
 * sheet is regenerated and vite's reload carries it to every open page. the
 * theme select of the bar and of the kit page posts a case's name to CASE_ROUTE;
 * the word is written into config/case.ts, the sheet rebuilt, and the page
 * loads itself again when the answer comes.
 */
import { execFile } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { CASE_ROUTE } from "../src/lib/case.ts";

const CASE_LINE = /export const CASE: CaseName = "[^"]+";/;
const CASE_WORD = /^[a-z][a-z0-9_]*$/;

export function kitThemePlugin(kitDir: string): Plugin {
  const configDir = join(kitDir, "config");
  let timer: ReturnType<typeof setTimeout> | null = null;
  const build = (env: Record<string, string>) =>
    new Promise<string>((resolve, reject) => {
      execFile("node", ["--experimental-strip-types", "build/theme.ts"], { cwd: kitDir, env: { ...process.env, ...env } }, (error, stdout, stderr) => {
        if (error) reject(new Error(stderr || error.message));
        else resolve(stdout.trim());
      });
    });
  const regenerate = (log: (msg: string) => void, env: Record<string, string>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      build(env).then(
        (out) => log(`kit theme regenerated: ${out}`),
        (e: Error) => log(`kit theme failed: ${e.message}`),
      );
    }, 120);
  };
  const writeCase = (name: string) => {
    const file = join(configDir, "case.ts");
    writeFileSync(file, readFileSync(file, "utf8").replace(CASE_LINE, `export const CASE: CaseName = "${name}";`));
  };
  return {
    name: "kit-theme-dev",
    apply: "serve",
    configureServer(server) {
      if (!existsSync(configDir)) return;
      server.watcher.add(configDir);
      // the server's loaded environment (the VITE_ names from its .env) goes to the build, so
      // the sheet and the page agree on the palette in use
      const onChange = (file: string) => {
        if (file.startsWith(configDir) && file.endsWith(".ts")) regenerate((msg) => server.config.logger.info(msg, { timestamp: true }), server.config.env);
      };
      server.watcher.on("change", onChange);
      server.watcher.on("add", onChange);
      server.middlewares.use(CASE_ROUTE, (req, res) => {
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
          const name = String((JSON.parse(body || "{}") as { case?: string }).case ?? "");
          if (!CASE_WORD.test(name) || !existsSync(join(configDir, name, "index.ts"))) {
            res.statusCode = 400;
            res.end("unknown case");
            return;
          }
          writeCase(name);
          build(server.config.env).then(
            () => {
              res.statusCode = 200;
              res.end(name);
            },
            (e: Error) => {
              res.statusCode = 500;
              res.end(e.message);
            },
          );
        });
      });
    },
  };
}
