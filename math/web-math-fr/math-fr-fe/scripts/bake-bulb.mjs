/**
 * bakes the front page's Mandelbulb into looping videos, so the front page plays a video instead
 * of running the shader. the live bulb is driven through one whole period of its turn, frame by
 * frame (window.__bulbPhase), in its contour light, and each frame is read from its canvas.
 *
 * the videos are plain H.264, which every computer and phone decodes in its hardware, the frames
 * laid on the page's own colour for each mode (a blend over the page cannot be used: the front
 * scene isolates itself, so a blend would see nothing behind it). each in two sizes, 1080
 * px and 720 px for small screens, with a still frame for devices that should not play video.
 *
 * needs the built site served and a Chrome open with its debugging port:
 *
 *   npm run build:pages && npx vite preview --port 1291 --base /web-3d-explore/ &
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
 *     --use-angle=metal --remote-debugging-port=9390 --user-data-dir=/tmp/bake-chrome &
 *   node scripts/bake-bulb.mjs [case ...]
 *
 * writes public/baked/bulb-<case>-<mode>-<size>.mp4 and bulb-<case>-<mode>.jpg. ffmpeg must be on
 * the path. the frames are written to a folder in /tmp and removed after each case.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "http://localhost:1291/web-3d-explore/?bake";
const CDP = "http://127.0.0.1:9390";
const CASES = process.argv.slice(2).length ? process.argv.slice(2) : ["base", "edge_light", "old_code", "pixel_art_cute"];
// the cases with a dark page only (DARK_ONLY in src/lib/site.ts)
const DARK_ONLY = ["pixel_art_cute"];
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

const encode = (frames, ground, out, side) => {
  // the square in the middle of the canvas, where the bulb is, laid on the ground colour
  const graph = `color=c=${ground}:s=${side}x${side}:r=${FPS}[g];[0:v]crop='min(iw,ih)':'min(iw,ih)',scale=${side}:${side}:flags=lanczos[f];[g][f]overlay=shortest=1,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`;
  // the colour standard written into the file, so a browser converts it back exactly and the
  // ground matches the page instead of showing as a lighter or darker square
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(frames, "f%04d.png"), "-filter_complex", graph, "-c:v", "libx264", "-preset", "slow", "-crf", side > 800 ? "30" : "28", "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", "-movflags", "+faststart", "-an", out]);
};

for (const kase of CASES) {
  await send("Page.navigate", { url: SITE });
  await wait(800);
  await ev(`localStorage.setItem("kit_case", "${kase}"); localStorage.setItem("kit_mode", "dark")`);
  await send("Page.navigate", { url: SITE });
  await wait(3500);
  await ev(`window.__bulbPhase = 0`);
  await wait(1500);
  // the page's ground in each mode, read from the sheet
  const ground = (mode) => ev(`(() => { document.documentElement.dataset.mode = "${mode}"; const c = getComputedStyle(document.documentElement).getPropertyValue("--c-background").trim(); document.documentElement.dataset.mode = "dark"; return c; })()`);
  const light = await ground("light");
  const dark = await ground("dark");
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
  const modes = DARK_ONLY.includes(kase) ? [["dark", dark]] : [["dark", dark], ["light", light]];
  for (const [mode, ground] of modes) {
    for (const side of SIZES) encode(dir, ground, join(OUT, `bulb-${kase}-${mode}-${side}.mp4`), side);
    // the still frame: a third of the way round
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", join(OUT, `bulb-${kase}-${mode}-720.mp4`), "-vf", `select=eq(n\\,${Math.round(frames / 3)})`, "-frames:v", "1", "-q:v", "3", join(OUT, `bulb-${kase}-${mode}.jpg`)]);
  }
  rmSync(dir, { recursive: true, force: true });
  console.log(`${kase}: ${frames} frames in ${Math.round((Date.now() - started) / 1000)} s (grounds ${dark}, ${light})`);
}
ws.close();
process.exit(0);
