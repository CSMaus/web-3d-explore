/**
 * bakes the front page's Mandelbulb into looping videos, one per theme (and view), so the front page
 * plays a video instead of running the shader. the live bulb is driven through one whole period
 * of its turn, frame by frame (window.__bulbPhase), and each frame is read from its canvas with
 * its transparency, so the video lies over the page and its background as the live one does.
 * two files a bake: WebM (VP9 with transparency) for Chrome and Firefox, MOV (HEVC with
 * transparency) for Safari.
 *
 * needs the built site served and a Chrome open with its debugging port:
 *
 *   npm run build:pages && npx vite preview --port 1291 --base /web-3d-explore/ &
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
 *     --use-angle=metal --remote-debugging-port=9390 --user-data-dir=/tmp/bake-chrome &
 *   node scripts/bake-bulb.mjs [case ...]
 *
 * writes public/baked/bulb-<case>-<view>.webm and .mov. ffmpeg must be on the path.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "http://localhost:1291/web-3d-explore/?bake";
const CDP = "http://127.0.0.1:9390";
const CASES = process.argv.slice(2).length ? process.argv.slice(2) : ["base", "edge_light", "old_code", "pixel_art_cute"];
// the front page shows the contour light only; BAKE_VIEWS=solid,contour bakes the solid too
const VIEWS = (process.env.BAKE_VIEWS ?? "contour").split(",");
// one whole period of the turn (42 s, Bulb.tsx), at this many frames a second
const SECONDS = 42;
const FPS = Number(process.env.BAKE_FPS ?? 20);
// the side of the square video, in pixels
const SIDE = Number(process.env.BAKE_SIDE ?? 1280);
const OUT = new URL("../public/baked/", import.meta.url).pathname;
const WORK = "/tmp/bake-bulb";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const list = await (await fetch(`${CDP}/json/list`)).json();
const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const waiting = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) {
    waiting.get(m.id)(m);
    waiting.delete(m.id);
  }
});
const send = (method, params = {}) => new Promise((res) => { const n = ++id; waiting.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

// a square viewport, so the scene's canvas is square around the bulb
// at twice the pixels, so the video holds its detail when it is shown large on a sharp screen
await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 1100, deviceScaleFactor: 2, mobile: false });
mkdirSync(OUT, { recursive: true });

for (const kase of CASES) {
  for (const view of VIEWS) {
    await send("Page.navigate", { url: SITE });
    await wait(800);
    await ev(`localStorage.setItem("kit_case", "${kase}"); localStorage.setItem("kit_mode", "dark")`);
    await send("Page.navigate", { url: SITE });
    await wait(3500);
    // the view: the first choice under the scene is the solid, the second the contour light
    await ev(`document.querySelectorAll('[data-slot="scene-foot"] button')[${view === "solid" ? 0 : 1}]?.click()`);
    await ev(`window.__bulbPhase = 0`);
    await wait(1500);
    const frames = SECONDS * FPS;
    rmSync(WORK, { recursive: true, force: true });
    mkdirSync(WORK, { recursive: true });
    const started = Date.now();
    for (let k = 0; k < frames; k++) {
      const url = await ev(`(async () => {
        window.__bulbPhase = ${k / frames};
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return document.querySelector('[data-slot="scene-picture"] canvas').toDataURL("image/png");
      })()`);
      writeFileSync(join(WORK, `f${String(k).padStart(4, "0")}.png`), Buffer.from(url.split(",")[1], "base64"));
    }
    const name = `bulb-${kase}-${view}`;
    // the square in the middle of the canvas, where the bulb is
    const crop = `crop='min(iw,ih)':'min(iw,ih)',scale=${SIDE}:${SIDE}:flags=lanczos`;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(WORK, "f%04d.png"), "-vf", `${crop},format=yuva420p`, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", process.env.BAKE_CRF ?? "38", "-row-mt", "1", "-auto-alt-ref", "0", "-an", join(OUT, `${name}.webm`)]);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(WORK, "f%04d.png"), "-vf", crop, "-c:v", "hevc_videotoolbox", "-alpha_quality", "0.5", "-q:v", process.env.BAKE_QUALITY ?? "55", "-tag:v", "hvc1", "-an", join(OUT, `${name}.mov`)]);
    console.log(`${name}: ${frames} frames in ${Math.round((Date.now() - started) / 1000)} s`);
  }
}
ws.close();
process.exit(0);
