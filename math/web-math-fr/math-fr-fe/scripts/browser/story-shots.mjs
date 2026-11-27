// photographs every step of a page's story, one png a step, the same way as fullshot.mjs:
// over the devtools websocket of a chrome that is already listening (docs/commands.md).
// usage: node story-shots.mjs <topic>/<page> [width]. MODE names light or dark.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 9390;
const SITE = "http://localhost:1263";
const WIDTH = 1200;
const HEIGHT = 900;
const SETTLE = 1600;
const PATIENCE = 5000;
const POLL = 250;
const OUT = fileURLToPath(new URL("../../shots/story/", import.meta.url));
const STORY = '[data-slot="story"]';
// the cookie notice stands over the bottom of the window until it is answered
const NOTICE = { name: "mathfr_session_consent", value: "declined" };

const [route, wide] = process.argv.slice(2);
const width = wide === undefined ? WIDTH : Number(wide);
const mode = process.env.MODE || "light";
if (!route || !/^[\w-]+\/[\w-]+$/.test(route) || !(width > 0)) {
  console.error("usage: node story-shots.mjs <topic>/<page> [width]");
  process.exit(2);
}
const [topic, name] = route.split("/");
const base = `http://127.0.0.1:${PORT}`;
const pause = ms => new Promise(r => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 60; i++) {
    try { return await (await fetch(`${base}/json/list`)).json(); }
    catch { await pause(POLL); }
  }
  throw new Error("no devtools");
}

const page = (await targets()).find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let id = 0;
const waiting = new Map();
ws.addEventListener("message", e => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
});
const send = (method, params = {}) =>
  new Promise(res => { const n = ++id; waiting.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const evaluate = async expr => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
};
const leave = code => { ws.close(); process.exit(code); };

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
await send("Network.setCookie", { ...NOTICE, url: SITE });
await send("Page.navigate", { url: `${SITE}/topics/${topic}/play/${name}` });

let found = false;
for (let waited = 0; waited <= PATIENCE && !found; waited += POLL) {
  await pause(POLL);
  found = await evaluate(`!!document.querySelector(${JSON.stringify(STORY)})`);
}
if (!found) {
  console.error("no story on this page");
  leave(1);
}
await evaluate(`localStorage.setItem("kit_mode", ${JSON.stringify(mode)}); document.documentElement.dataset.mode = ${JSON.stringify(mode)}; "ok"`);

// the count is read as numbers only, so it holds in every language: the smaller is the step
const READ = `(() => {
  const story = document.querySelector(${JSON.stringify(STORY)});
  story.scrollIntoView({ block: "center" });
  const box = story.getBoundingClientRect();
  const count = (story.querySelector('[data-slot="story-count"]').textContent.match(/\\d+/g) || []).map(Number);
  return JSON.stringify({
    id: story.dataset.step || "step",
    at: Math.min(...count),
    of: Math.max(...count),
    x: box.left + window.scrollX,
    y: box.top + window.scrollY,
    width: box.width,
    height: box.height,
  });
})()`;
const NEXT = `document.querySelectorAll(${JSON.stringify(STORY + ' [data-slot="story-nav"] button')})[2].click(); "ok"`;

const dir = path.join(OUT, `${topic}-${name}`, mode === "dark" ? `w${width}-dark` : `w${width}`);
fs.mkdirSync(dir, { recursive: true });
let shots = 0;
let steps = 0;
for (;;) {
  await evaluate(READ);
  await pause(SETTLE);
  const now = JSON.parse(await evaluate(READ));
  steps = now.of;
  if (now.at !== shots + 1) break;
  const r = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    clip: { x: now.x, y: now.y, width: now.width, height: now.height, scale: 1 },
  });
  shots += 1;
  fs.writeFileSync(path.join(dir, `${String(shots).padStart(2, "0")}-${now.id}.png`), Buffer.from(r.result.data, "base64"));
  if (now.at >= now.of) break;
  await evaluate(NEXT);
}

console.log(`${shots} shots -> ${dir}`);
if (shots !== steps) {
  console.error(`${shots} shots for ${steps} steps`);
  leave(1);
}
leave(0);
