import { createFileRoute } from "@tanstack/react-router";
import { Input, Button, Text, Heading, Page } from "@kit/index";
import { useEffect, useState } from "react";
import { api, HAS_BACKEND, type Account, type Preset } from "@/lib/api";
import { L } from "@/lib/lang";

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
      setTrouble(err instanceof Error ? err.message : L("That did not work"));
    }
  };

  const leave = async () => {
    await api.logout();
    setWho(null);
    setPresets([]);
  };

  if (!HAS_BACKEND) {
    return (
      <Page className="pb-24">
        <Heading level={1}>{L("Account")}</Heading>
        <Text kind="intro" as="p" className="mt-3 max-w-xl">{L("Accounts and saved parameter sets need the backend, and this copy of the site runs without one.")}</Text>
      </Page>
    );
  }

  if (who) {
    return (
      <Page className="pb-24">
        <Heading level={1}>{L("Account")}</Heading>
        <Text kind="caption" as="p" className="mt-3">{who.email}</Text>
        <Button variant="outline" size="sm" className="mt-4"
          type="button"
          onClick={leave}
        >
          {L("Sign out")}
        </Button>
        <section className="mt-10">
          <Heading level={2}>
            {L("Stored parameter sets")}
          </Heading>
          {presets.length === 0 ? (
            <Text kind="intro" as="p" className="mt-3">
              {L("Nothing kept yet. A picture saved from any play page appears here with its own address.")}
            </Text>
          ) : (
            <ul className="mt-3 space-y-2">
              {presets.map((p) => (
                <li key={p.slug} className="rounded border border-border px-3 py-2">
                  <div data-text="caption" className="flex items-baseline justify-between">
                    <span className="text-foreground">{p.title ?? p.slug}</span>
                    <span className="text-muted-foreground">{p.system}</span>
                  </div>
                  <div data-text="caption" className="mt-1">/P/{p.slug}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Page>
    );
  }

  return (
    <Page className="pb-24">
      <Heading level={1}>{L("Account")}</Heading>
      <div className="mt-4 flex gap-2">
        {(["login", "signup"] as const).map((m) => (
          <Button variant="outline" size="sm"
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
          >
            {m === "login" ? L("login") : L("signup")}
          </Button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={L("Address")}
        />
        <Input
          type="password"
          required
          minLength={10}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={L("At least ten characters")}
        />
        <Button variant="outline" size="sm" className="w-full"
          type="submit"
        >
          {mode === "login" ? L("login") : L("signup")}
        </Button>
      </form>
      {trouble ? <Text kind="warning" as="p" className="mt-3">{trouble}</Text> : null}
    </Page>
  );
}
