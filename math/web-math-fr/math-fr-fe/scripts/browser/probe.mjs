// drives one page in a headless chrome over the devtools websocket and prints what a script
// found there. usage: node probe.mjs <url> <script.js> [screenshot.png]. chrome must already be
// listening on the port below (the command is in docs/commands.md). the script is evaluated in
// the page and its returned string is printed; the optional screenshot is saved as a png, which
// is then read with an image viewer or the assistant's Read tool and looked at.
const PORT = 9390;
const base = `http://127.0.0.1:${PORT}`;

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

const url = process.argv[2];
const script = process.argv[3];
await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url });
await new Promise(r => setTimeout(r, 3500));
console.log(await evaluate(await import("node:fs").then(fs => fs.readFileSync(script, "utf8"))));
const shot = process.argv[4];
if (shot) {
  const r = await send("Page.captureScreenshot", { format: "png" });
  const fs = await import("node:fs");
  fs.writeFileSync(shot, Buffer.from(r.result.data, "base64"));
  console.log("shot -> " + shot);
}
ws.close();
process.exit(0);
