// runs axe-core on one page in the headless chrome and prints the violations, one line per
// failing element: rule, impact, a short selector, and the summary.
// usage: MODE=light node a11y.mjs <url> [axe.min.js path]
const PORT = 9390;
const base = `http://127.0.0.1:${PORT}`;
const mode = process.env.MODE || "light";
const axePath = process.argv[3] || "node_modules/axe-core/axe.min.js";
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
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600));
  return r.result?.result?.value;
};
const fs = await import("node:fs");
const url = process.argv[2];
await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url });
await new Promise(r => setTimeout(r, 3000));
await evaluate(`localStorage.setItem("kit_mode", ${JSON.stringify(mode)}); document.documentElement.dataset.mode = ${JSON.stringify(mode)}; "ok"`);
await new Promise(r => setTimeout(r, 1500));
await evaluate(fs.readFileSync(axePath, "utf8") + "; 'axe loaded'");
const out = await evaluate(`axe.run(document, { resultTypes: ["violations"] }).then(r => JSON.stringify(r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 6).map(n => ({ target: n.target[0], summary: n.failureSummary.replace(/\\s+/g, " ").slice(0, 220) })), count: v.nodes.length }))))`);
const v = JSON.parse(out);
console.log(`${url}  ${mode}  violations: ${v.length}`);
for (const x of v) {
  console.log(`- ${x.id} [${x.impact}] ${x.help} (${x.count})`);
  for (const n of x.nodes) console.log(`    ${n.target}  ::  ${n.summary}`);
}
ws.close();
process.exit(0);
