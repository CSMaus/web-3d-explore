/**
 * writes one saved theme into the stylesheet, which is the only place the
 * product's look lives. run from math-fr-fe:
 *
 *   npm run theme:ship -- <name>
 *
 * the theme is read from themes/<name>.json, and the two token blocks of
 * src/styles.css are replaced; nothing else in the file is touched.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseTheme, shipInto, validName } from "../src/theme/theme.ts";

const name = process.argv[2];
if (!validName(name)) {
  console.error("Usage: npm run theme:ship -- <name>   (letters, digits and hyphens)");
  process.exit(2);
}
const theme = parseTheme(JSON.parse(readFileSync(`themes/${name}.json`, "utf8")));
if (!theme) {
  console.error(`themes/${name}.json is not a theme`);
  process.exit(2);
}
const before = readFileSync("src/styles.css", "utf8");
const after = shipInto(before, theme);
if (after === before) {
  console.log(`src/styles.css already carries ${name}`);
} else {
  writeFileSync("src/styles.css", after);
  console.log(`src/styles.css now carries ${name}`);
}
