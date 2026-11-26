/**
 * the feedback relay. a reader's message and the page it was written on arrive from the site's
 * form; this checks that they come from the site, that the spam check passed, and that they are a
 * sensible size, then sends them to the owner's Telegram as plain text. nothing is stored and
 * nothing is logged. the secrets live only in Cloudflare (wrangler secret put).
 */
export interface Env {
  TG_TOKEN: string;
  TG_CHAT_ID: string;
  TURNSTILE_SECRET: string;
  ALLOWED_ORIGIN: string;
}

const MOST_CHARS = 2000;
const MOST_PAGE = 200;
/** the largest request body read at all, in bytes; a message of 2000 characters fits well inside */
const MOST_BYTES = 16 * 1024;
/** how many messages one address may send in the window; a best effort inside one Worker instance */
const PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;
const recent = new Map<string, number[]>();

function reply(status: number, body: unknown, origin: string): Response {
  // a 204 carries no body at all
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    },
  });
}

function tooMany(address: string): boolean {
  const now = Date.now();
  // forget addresses whose last message is out of the window, so the map does not grow for ever
  for (const [key, times] of recent) if (now - times[times.length - 1] >= WINDOW_MS) recent.delete(key);
  const times = (recent.get(address) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= PER_WINDOW) {
    recent.set(address, times);
    return true;
  }
  times.push(now);
  recent.set(address, times);
  return false;
}

async function humanChecked(token: string, secret: string, address: string, host: string): Promise<boolean> {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (address) form.append("remoteip", address);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const out = (await res.json()) as { success?: boolean; hostname?: string };
  // the token must have been solved on the site itself, not on another page using the same key
  return out.success === true && out.hostname === host;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN;
    if (request.method === "OPTIONS") return reply(204, null, origin);
    if (request.method !== "POST" || request.headers.get("Origin") !== origin) return reply(403, { ok: false, why: "not allowed" }, origin);

    if (Number(request.headers.get("Content-Length") ?? MOST_BYTES + 1) > MOST_BYTES) return reply(413, { ok: false, why: "too large" }, origin);
    let body: { message?: unknown; page?: unknown; token?: unknown };
    try {
      body = await request.json();
    } catch {
      return reply(400, { ok: false, why: "not json" }, origin);
    }
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const page = typeof body.page === "string" ? body.page : "";
    const token = typeof body.token === "string" ? body.token : "";
    if (!message || message.length > MOST_CHARS) return reply(400, { ok: false, why: "message size" }, origin);
    if (!page.startsWith("/") || page.length > MOST_PAGE) return reply(400, { ok: false, why: "page" }, origin);

    const address = request.headers.get("CF-Connecting-IP") ?? "";
    if (tooMany(address)) return reply(429, { ok: false, why: "too many" }, origin);
    try {
      if (!token || !(await humanChecked(token, env.TURNSTILE_SECRET, address, new URL(origin).hostname))) return reply(403, { ok: false, why: "spam check" }, origin);

      // plain text: no parse mode, so nothing a reader writes is read as formatting or a link preview
      const res = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text: `Page: ${page}\n\n${message}`, disable_web_page_preview: true }),
      });
      return res.ok ? reply(200, { ok: true }, origin) : reply(502, { ok: false, why: "telegram" }, origin);
    } catch {
      // a check or a send that could not be reached: still an answer the page can read
      return reply(502, { ok: false, why: "upstream" }, origin);
    }
  },
};
