// like scripts/browser/probe.mjs, but the screenshot is the whole page, and the page is put in
// the mode named by MODE (light or dark) before the script runs.
// usage: node fullshot.mjs <url> <script.js> [screenshot.png]
const PORT = 9390;
const base = `http://127.0.0.1:${PORT}`;
const mode = process.env.MODE || "light";
async function targets() {
  for (let i = 0; i < 60; i++) {
    try { return await (await fetch(`${base}/json/list`)).json(); }
    catch { await new Promise(r => setTimeout(r, 250)); }
  }
  throw new Error("no devtools");
}
const page = (await targets()).find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let id = 0;
const waiting = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } });
const send = (method, params = {}) => new Promise(res => { const n = ++id; waiting.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const evaluate = async expr => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
};
const url = process.argv[2];
const script = process.argv[3];
await send("Page.enable");
await send("Runtime.enable");
// WIDTH names a narrower viewport, for the folded rail of a phone
if (process.env.WIDTH) await send("Emulation.setDeviceMetricsOverride", { width: Number(process.env.WIDTH), height: 900, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url });
await new Promise(r => setTimeout(r, 3000));
await evaluate(`localStorage.setItem("kit_mode", ${JSON.stringify(mode)}); document.documentElement.dataset.mode = ${JSON.stringify(mode)}; "ok"`);
await new Promise(r => setTimeout(r, 800));
const fs = await import("node:fs");
console.log(await evaluate(fs.readFileSync(script, "utf8")));
const shot = process.argv[4];
if (shot) {
  const m = await send("Page.getLayoutMetrics");
  const h = Math.min(Math.ceil(m.result.cssContentSize.height), 12000);
  const w = Math.ceil(m.result.cssContentSize.width);
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  fs.writeFileSync(shot, Buffer.from(r.result.data, "base64"));
  console.log("shot -> " + shot + " " + w + "x" + h);
}
ws.close();
process.exit(0);
