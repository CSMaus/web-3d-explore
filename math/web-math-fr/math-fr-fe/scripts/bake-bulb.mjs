/**
 * bakes the front page's Mandelbulb into looping videos, so the front page plays a video instead
 * of running the shader. the live bulb is driven through one whole period of its turn, frame by
 * frame (window.__bulbPhase), in its contour light, and each frame is read from its canvas.
 *
 * the videos are plain H.264, which every computer and phone decodes in its hardware, and keep
 * the bulb's transparency the way such video can: each frame holds the bulb (on black) in its top
 * half and its transparency, as grey, in its bottom half; the page joins the two halves again
 * (BakedBulb.tsx), so the bulb lies over the page and its background as the live one did. two
 * sizes, 1080 px and 720 px for small screens, and a still frame with its transparency (PNG).
 *
 * needs the built site served and a Chrome open with its debugging port:
 *
 *   npm run build:pages && npx vite preview --port 1291 --base /web-3d-explore/ &
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
 *     --use-angle=metal --remote-debugging-port=9390 --user-data-dir=/tmp/bake-chrome &
 *   node scripts/bake-bulb.mjs [case ...]
 *
 * writes public/baked/bulb-<case>-<size>.mp4 and bulb-<case>.png. ffmpeg must be on the path. the frames are written to a folder in /tmp and removed after each case.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "http://localhost:1291/web-3d-explore/?bake";
const CDP = "http://127.0.0.1:9390";
const CASES = process.argv.slice(2).length ? process.argv.slice(2) : ["base", "edge_light", "old_code", "pixel_art_cute"];
// one whole period of the turn (42 s, Bulb.tsx), at this many frames a second
const SECONDS = 42;
const FPS = Number(process.env.BAKE_FPS ?? 20);
const SIZES = [1080, 720];
const OUT = new URL("../public/baked/", import.meta.url).pathname;
const WORK = "/tmp/bake-bulb";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const list = await (await fetch(`${CDP}/json/list`)).json();
const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
ws.addEventListener("close", () => {
  console.error("the browser closed the connection; nothing more is baked");
  process.exit(1);
});
let id = 0;
const waiting = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) {
    waiting.get(m.id)(m);
    waiting.delete(m.id);
  }
});
// every call gives up after a minute, so a browser that stops answering ends the bake with a word
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const n = ++id;
    const late = setTimeout(() => rej(new Error(`${method} did not answer`)), 60000);
    waiting.set(n, (m) => {
      clearTimeout(late);
      res(m);
    });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

// at twice the pixels, so the video holds its detail when it is shown large on a sharp screen
await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 1100, deviceScaleFactor: 2, mobile: false });
mkdirSync(OUT, { recursive: true });

const encode = (frames, out, side) => {
  // the square in the middle of the canvas, where the bulb is: on black above, its transparency
  // as grey below; the colour standard is written into the file, so the browser reads it back
  // exactly and the joined bulb keeps its colours and edges
  const graph = [
    `[0:v]crop='min(iw,ih)':'min(iw,ih)',scale=${side}:${side}:flags=lanczos,format=rgba,split[a][b]`,
    `color=c=black:s=${side}x${side}:r=${FPS}[g]`,
    `[g][a]overlay=shortest=1,format=rgb24[top]`,
    `[b]alphaextract,format=rgb24[low]`,
    `[top][low]vstack,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`,
  ].join(";");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(frames, "f%04d.png"), "-filter_complex", graph, "-c:v", "libx264", "-preset", "slow", "-crf", side > 800 ? "28" : "27", "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", "-movflags", "+faststart", "-an", out]);
};

for (const kase of CASES) {
  await send("Page.navigate", { url: SITE });
  await wait(800);
  await ev(`localStorage.setItem("kit_case", "${kase}"); localStorage.setItem("kit_mode", "dark")`);
  await send("Page.navigate", { url: SITE });
  await wait(3500);
  await ev(`window.__bulbPhase = 0`);
  await wait(1500);
  const frames = SECONDS * FPS;
  const dir = join(WORK, kase);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const started = Date.now();
  for (let k = 0; k < frames; k++) {
    const url = await ev(`(async () => {
      window.__bulbPhase = ${k / frames};
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return document.querySelector('[data-slot="scene-picture"] canvas').toDataURL("image/png");
    })()`);
    writeFileSync(join(dir, `f${String(k).padStart(4, "0")}.png`), Buffer.from(url.split(",")[1], "base64"));
  }
  for (const side of SIZES) encode(dir, join(OUT, `bulb-${kase}-${side}.mp4`), side);
  // the still frame, a third of the way round, with its transparency
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", join(dir, `f${String(Math.round(frames / 3)).padStart(4, "0")}.png`), "-vf", "crop='min(iw,ih)':'min(iw,ih)',scale=720:720:flags=lanczos", join(OUT, `bulb-${kase}.png`)]);
  rmSync(dir, { recursive: true, force: true });
  console.log(`${kase}: ${frames} frames in ${Math.round((Date.now() - started) / 1000)} s`);
}
ws.close();
process.exit(0);
