import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Account, type Preset } from "@/lib/api";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  const [who, setWho] = useState<Account | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [trouble, setTrouble] = useState<string | null>(null);

  const refresh = () => {
    api
      .me()
      .then((found) => {
        setWho(found);
        return found ? api.presets() : Promise.resolve([]);
      })
      .then(setPresets)
      .catch(() => setPresets([]));
  };

  useEffect(refresh, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTrouble(null);
    try {
      if (mode === "signup") await api.signup(email, secret);
      else await api.login(email, secret);
      setSecret("");
      refresh();
    } catch (err) {
      setTrouble(err instanceof Error ? err.message : "that did not work");
    }
  };

  const leave = async () => {
    await api.logout();
    setWho(null);
    setPresets([]);
  };

  if (who) {
    return (
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
        <h1 className="font-mono text-sm tracking-wide text-leaf">account</h1>
        <p className="mt-3 font-mono text-xs text-muted">{who.email}</p>
        <button
          type="button"
          onClick={leave}
          className="mt-4 rounded border border-edge px-3 py-1.5 font-mono text-xs text-muted hover:border-leaf"
        >
          sign out
        </button>
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-sky">
            stored parameter sets
          </h2>
          {presets.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              nothing kept yet. a picture saved from any play page appears here with its own
              address.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {presets.map((p) => (
                <li key={p.slug} className="rounded border border-edge px-3 py-2">
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span className="text-ink">{p.title ?? p.slug}</span>
                    <span className="text-muted">{p.system}</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-muted">/p/{p.slug}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
      <h1 className="font-mono text-sm tracking-wide text-leaf">account</h1>
      <div className="mt-4 flex gap-2">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={
              mode === m
                ? "rounded border border-leaf px-3 py-1 font-mono text-xs text-leaf"
                : "rounded border border-edge px-3 py-1 font-mono text-xs text-muted"
            }
          >
            {m}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="address"
          className="w-full rounded border border-edge bg-ground px-3 py-2 font-mono text-xs text-ink outline-none focus:border-leaf"
        />
        <input
          type="password"
          required
          minLength={10}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="at least ten characters"
          className="w-full rounded border border-edge bg-ground px-3 py-2 font-mono text-xs text-ink outline-none focus:border-leaf"
        />
        <button
          type="submit"
          className="w-full rounded border border-leaf px-3 py-2 font-mono text-xs text-leaf"
        >
          {mode}
        </button>
      </form>
      {trouble ? <p className="mt-3 text-xs text-warn">{trouble}</p> : null}
    </main>
  );
}
