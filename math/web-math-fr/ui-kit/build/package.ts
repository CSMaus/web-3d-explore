/**
 * builds the kit as an npm package and packs it. run from ui-kit:
 *
 *   npm run package              (the base case; VITE_KIT_CASE names another)
 *
 * dist/ gets the theme sheet of the case, index.css and registry.css (index.css
 * carries an @source line so the consumer's tailwind reads the bundle's classes),
 * the es bundle from vite.lib.config.ts, and the declarations from tsconfig.lib.json;
 * the tarball lands in dist/pack/.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = `${root}dist/`;
const kitCase = process.env.VITE_KIT_CASE || "base";
const env = { ...process.env, VITE_KIT_CASE: kitCase };
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: root, env, stdio: "inherit" });

rmSync(dist, { recursive: true, force: true });
mkdirSync(`${dist}pack`, { recursive: true });

run("node", ["--experimental-strip-types", "build/theme.ts", `${dist}theme.css`]);
copyFileSync(`${root}src/registry.css`, `${dist}registry.css`);
const css = readFileSync(`${root}src/index.css`, "utf8");
writeFileSync(`${dist}index.css`, `${css}\n/* the bundle's classes, for the consuming project's tailwind */\n@source "./index.js";\n`);

run("npx", ["vite", "build", "-c", "vite.lib.config.ts"]);
run("npx", ["tsc", "-p", "tsconfig.lib.json"]);
run("npm", ["pack", "--pack-destination", `${dist}pack`]);
console.log(`packed case ${kitCase} into dist/pack/`);
