/** the worker against a fake Telegram and a fake Turnstile: npm test. nothing leaves the machine. */
import worker from "../src/index.ts";
const env = { TG_TOKEN: "t", TG_CHAT_ID: "1", TURNSTILE_SECRET: "s", ALLOWED_ORIGIN: "https://csmaus.github.io" };
let sent: string[] = []; let host = "csmaus.github.io"; let down = false;
(globalThis as any).fetch = async (url: string, init: any) => {
  if (down) throw new Error("unreachable");
  if (url.includes("siteverify")) return new Response(JSON.stringify({ success: true, hostname: host }));
  sent.push(JSON.parse(init.body).text); return new Response("{}", { status: 200 });
};
const post = (body: unknown, extra: Record<string, string> = {}) => {
  const text = JSON.stringify(body);
  return worker.fetch(new Request("https://w.dev", { method: "POST", body: text, headers: { Origin: env.ALLOWED_ORIGIN, "Content-Type": "application/json", "Content-Length": String(text.length), "CF-Connecting-IP": extra.ip ?? "1.1.1.1", ...extra } }), env);
};
const ok = (c: boolean, m: string) => { console.log(c ? "ok  " : "FAIL", m); if (!c) process.exitCode = 1; };
const pre = await worker.fetch(new Request("https://w.dev", { method: "OPTIONS", headers: { Origin: env.ALLOWED_ORIGIN } }), env);
ok(pre.status === 204 && pre.headers.get("Access-Control-Allow-Origin") === env.ALLOWED_ORIGIN, "preflight answers 204 with CORS");
ok((await post({ message: "hi", page: "/x", token: "k" })).status === 200 && sent[0] === "Page: /x\n\nhi", "good message is sent as plain text");
ok((await worker.fetch(new Request("https://w.dev", { method: "POST", body: "{}", headers: { Origin: "https://evil.example" } }), env)).status === 403, "other origin refused");
ok((await post({ message: "x".repeat(2001), page: "/x", token: "k" }, { ip: "2" })).status === 400, "long message refused");
ok((await post({ message: "hi", page: "x", token: "k" }, { ip: "2" })).status === 400, "bad page refused");
ok((await post({ message: "hi", page: "/x", token: "k" }, { ip: "3", "Content-Length": "999999" })).status === 413, "oversized body refused before reading");
host = "other.site"; ok((await post({ message: "hi", page: "/x", token: "k" }, { ip: "4" })).status === 403, "token from another host refused"); host = "csmaus.github.io";
down = true; const r = await post({ message: "hi", page: "/x", token: "k" }, { ip: "5" }); ok(r.status === 502 && r.headers.get("Access-Control-Allow-Origin") === env.ALLOWED_ORIGIN, "unreachable upstream gives 502 with CORS"); down = false;
for (let i = 0; i < 5; i++) await post({ message: "hi", page: "/x", token: "k" }, { ip: "6" });
ok((await post({ message: "hi", page: "/x", token: "k" }, { ip: "6" })).status === 429, "sixth message in ten minutes refused");
