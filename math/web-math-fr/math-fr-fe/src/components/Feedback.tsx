import { useRouterState } from "@tanstack/react-router";
import { Button, Text, Textarea } from "@kit/index";
import { useEffect, useRef, useState } from "react";
import { L } from "@/lib/lang";
import { FEEDBACK_URL, TURNSTILE_SITE_KEY } from "@/lib/site";

const MOST = 2000;
type Turnstile = { render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }) => string; remove: (id: string) => void; reset: (id: string) => void };

/** the spam check's script, loaded once, only when the form is first opened */
function loadTurnstile(): Promise<Turnstile> {
  const w = window as unknown as { turnstile?: Turnstile };
  if (w.turnstile) return Promise.resolve(w.turnstile);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => (w.turnstile ? resolve(w.turnstile) : reject(new Error("no turnstile")));
    s.onerror = () => reject(new Error("turnstile did not load"));
    document.head.appendChild(s);
  });
}

/**
 * the foot of every page: a button that opens a short form for a suggestion or a review. the
 * message goes to the owner's Telegram through the relay, with the page it was written on added
 * by itself. shown only when the relay is set up (lib/site.ts).
 */
export function Feedback() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const box = useRef<HTMLDivElement | null>(null);
  // the spam check's widget, kept so it can be reset: its token is good for one send only
  const widget = useRef("");

  useEffect(() => {
    if (!open || !box.current) return;
    let id = "";
    let gone = false;
    loadTurnstile()
      .then((t) => {
        if (gone || !box.current) return;
        id = t.render(box.current, { sitekey: TURNSTILE_SITE_KEY, callback: setToken, "expired-callback": () => setToken("") });
        widget.current = id;
      })
      .catch(() => setState("failed"));
    return () => {
      gone = true;
      const w = window as unknown as { turnstile?: Turnstile };
      if (id) w.turnstile?.remove(id);
      widget.current = "";
    };
  }, [open]);

  if (!FEEDBACK_URL || !TURNSTILE_SITE_KEY) return null;

  const send = async () => {
    setState("sending");
    try {
      const res = await fetch(FEEDBACK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text.trim(), page: path, token }) });
      setState(res.ok ? "sent" : "failed");
      if (res.ok) setText("");
    } catch {
      setState("failed");
    } finally {
      // the token was spent on this send; a fresh check gives the next one
      setToken("");
      const w = window as unknown as { turnstile?: Turnstile };
      if (widget.current) w.turnstile?.reset(widget.current);
    }
  };

  return (
    <footer data-slot="site-foot" className="mx-auto max-w-[var(--page-width)] px-[var(--page-gutter)] pb-10 pt-6">
      {!open ? (
        <Button variant="outline" size="sm" onClick={() => { setOpen(true); setState("idle"); }}>
          {L("Send a suggestion or a review")}
        </Button>
      ) : (
        <div data-slot="panel" className="max-w-xl space-y-3">
          <label className="block">
            <span data-text="label">{L("A suggestion or a review of this page")}</span>
            <Textarea className="mt-2" rows={5} maxLength={MOST} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <Text kind="note" as="p">
            {L("The message goes to the owner of the site together with the address of this page, {{page}}. Nothing else about the sender is sent. Messages travel through Telegram, which does not encrypt them end to end, so nothing private should be written here.", { page: path })}
          </Text>
          <div ref={box} />
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" disabled={!text.trim() || !token || state === "sending"} onClick={send}>
              {state === "sending" ? L("Sending") : L("Send")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{L("Close")}</Button>
            <span data-text="note" className="tabular-nums">{`${text.length} / ${MOST}`}</span>
          </div>
          <div role="status">
            {state === "sent" ? <Text kind="note" as="p">{L("Sent, with thanks.")}</Text> : null}
            {state === "failed" ? <Text kind="warning" as="p">{L("The message was not sent. The automatic check against spam may have expired. Sending again usually works.")}</Text> : null}
          </div>
        </div>
      )}
    </footer>
  );
}
