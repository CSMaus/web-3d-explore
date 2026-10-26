/**
 * reads every markdown file in the repository that is written for a reader and fails when a
 * sentence, heading, list item or table cell starts with a lowercase plain word. code fences,
 * inline code, paths, file names, identifiers and a short list of lowercase brand names are
 * left alone. the folders and files listed in SKIP are the owner's own notes, which keep
 * whatever case they were written in.
 *
 *   npm run check:docs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../../../..", import.meta.url)));
const SKIP_DIRS = new Set(["node_modules", ".git", ".venv", "storybook-static", ".claude", ".pytest_cache", "dist", "media", "videos"]);
// verbatim records are left as they are: video-texts.md keeps the old clip texts word for word,
// and the clip timelines quote the on-screen captions, which are lower case, exactly;
// the Korean voice-over has no capital letters to check, and its sentences may open on a maths
// symbol (z, c, i), which stays lower case
const SKIP = new Set(["rules.md", "CLAUDE.md", "notes.md", "math/docs/idea1.md", "math/docs/idea2.md", "math/docs/idea3.md", "math/01-fractals/fractals_idea.md", "math/web-math-fr/docs/video-texts.md", "math/01-fractals/narration/timeline-parts-01-05.md", "math/01-fractals/narration/timeline-parts-06-08.md", "math/01-fractals/narration/timeline-parts-09-11.md", "math/01-fractals/narration/voiceover-b-ko.md"]);
const LOWER_OK = new Set(["shadcn", "npm", "npx", "uv", "pip", "git", "node", "pytest", "colah", "i18next", "zustand", "nginx", "systemd", "ffmpeg", "numpy", "scipy", "tsc", "vitest", "eslint", "ruff", "alembic", "uvicorn", "docker", "manim", "katex", "macos", "jsdom", "radix", "lucide", "cva", "cn", "clsx", "i18n", "a11y", "http", "https", "www", "src", "sudo", "curl", "brew", "apt", "bash", "zsh", "vite", "tailwind", "storybook", "prettier", "pydantic", "sqlalchemy", "fastapi", "react", "localhost", "cron", "ssh"]);
const ABBREV = new Set(["e.g", "i.e", "vs", "etc", "cf", "approx", "fig", "no", "nr", "ca", "min", "max", "st", "mr", "dr", "eq", "ch", "sec", "p", "pp", "vol", "al", "resp", "incl", "ref", "px", "ms", "pt"]);

function files(dir: string, out: string[]): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (SKIP_DIRS.has(name)) continue;
    const st = statSync(full);
    if (st.isDirectory()) files(full, out);
    else if (name.endsWith(".md") && !SKIP.has(relative(ROOT, full))) out.push(full);
  }
  return out;
}

function endsSentence(text: string): boolean {
  const t = text.trimEnd().replace(/["')*_\]]+$/, "");
  if (!t) return false;
  if (!/[.?!]$/.test(t)) return false;
  const last = t.split(/\s+/).pop() ?? t;
  if (/^[.?!]+$/.test(last)) return false;
  const prev = /([\w.']+)[.?!]$/.exec(t);
  if (!prev || !t.endsWith(".")) return true;
  const word = prev[1].replace(/\.$/, "");
  return !(ABBREV.has(word.toLowerCase()) || word.includes(".") || word.length === 1);
}

function plainWord(tok: string): string | null {
  const m = /^["'(*_[]*([a-z][a-z']*)([^\w]|$)/.exec(tok);
  if (!m || /^\(?[ivx]+\)/.test(tok)) return null;
  const core = tok.replace(/^["'(*_[]+/, "");
  if (/[/_=@$\\]/.test(core) || /\.[a-z0-9]/.test(core) || /[A-Z]/.test(core) || /\d/.test(core)) return null;
  return LOWER_OK.has(m[1]) ? null : m[1];
}

function check(path: string): string[] {
  const problems: string[] = [];
  let fence = false;
  let start = true;
  const lines = readFileSync(path, "utf8").split("\n");
  lines.forEach((raw, i) => {
    if (/^\s*(```|~~~)/.test(raw)) { fence = !fence; start = true; return; }
    if (fence) return;
    if (raw.trim() === "" || raw.trimStart().startsWith("<") || /^(\s{4}|\t)/.test(raw)) { start = true; return; }
    if (/^\s*\|?\s*:?-{2,}/.test(raw) && raw.includes("|")) { start = true; return; }
    const m = /^(\s*)(#+\s+|[-*+]\s+(\[[ x]\]\s+)?|\d+[.)]\s+|>\s*|\|\s*)?(.*)$/.exec(raw)!;
    const prefix = m[2] ?? "";
    let body = m[4];
    let at = start || prefix !== "";
    if (prefix.startsWith("|")) body = body.replace(/\s*\|\s*/g, " | ");
    const segments = body.split(/(`+[^`]*`+)/);
    for (const seg of segments) {
      if (seg.startsWith("`")) { at = false; continue; }
      for (const tok of seg.split(/\s+/)) {
        if (!tok) continue;
        if (tok === "|") { at = true; continue; }
        if (at) {
          const word = plainWord(tok);
          if (word) problems.push(`${relative(ROOT, path)}:${i + 1}: "${word}" starts a sentence in lowercase`);
        }
        at = endsSentence(tok);
      }
    }
    start = prefix.startsWith("#") ? true : at;
  });
  return problems;
}

const found = files(ROOT, []).flatMap(check);
for (const p of found) console.log(p);
console.log(found.length === 0 ? "docs: every sentence starts with a capital" : `docs: ${found.length} lowercase sentence starts`);
process.exit(found.length === 0 ? 0 : 1);
