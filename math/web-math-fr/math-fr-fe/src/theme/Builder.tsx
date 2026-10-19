import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Text, Heading } from "@kit/index";
import { Choices } from "@/components/Choices";
import { Slider } from "@/components/Slider";
import { applyTheme } from "@/theme/apply";
import { COLOUR_NAMES, COLOUR_ROLES, DEFAULT, FONT_STACKS, validName, type Theme } from "@/theme/theme";

/**
 * the theme builder: a page that exists only in development, where every value
 * the site's look is made of can be moved with the real site in view, and the
 * result saved as a named version in the themes folder. nothing here ships.
 */

const ROUTE = "/__themes";
const PAGES = [
  { id: "/", label: "Front page" },
  { id: "/topics", label: "Topics" },
  { id: "/topics/fractals/parts", label: "Series page" },
  { id: "/topics/fractals/play/julia", label: "A fractal page" },
  { id: "/topics/networks/play/unit", label: "A network page" },
  { id: "/topics/networks/theory", label: "Mathematics" },
  { id: "/account", label: "Account" },
];
const SCHEMES = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
] as const;
const MOTION = [
  { id: "on", label: "Sections rise in" },
  { id: "off", label: "No motion" },
] as const;
const BODY_STACKS = FONT_STACKS.filter((f) => f.body);
const MONO_STACKS = FONT_STACKS.filter((f) => f.mono);

export default function Builder() {
  const [theme, setTheme] = useState<Theme>(DEFAULT);
  const [saved, setSaved] = useState<Theme[]>([]);
  const [page, setPage] = useState(PAGES[4].id);
  const [note, setNote] = useState("");
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);

  const fetchSaved = useCallback(
    () =>
      fetch(ROUTE)
        .then((res) => (res.ok ? (res.json() as Promise<Theme[]>) : Promise.reject(new Error(String(res.status)))))
        .catch(() => null),
    [],
  );
  useEffect(() => {
    let alive = true;
    fetchSaved().then((list) => {
      if (!alive) return;
      if (list) setSaved(list);
      else setNote("The dev server is not answering, so nothing can be saved or loaded.");
    });
    return () => {
      alive = false;
    };
  }, [fetchSaved]);

  // the theme goes on this page and on the page in the frame, and every
  // picture in the frame is told to repaint
  useEffect(() => {
    applyTheme(document, theme);
    const doc = frame.current?.contentDocument;
    const win = frame.current?.contentWindow;
    if (doc && win) {
      applyTheme(doc, theme);
      win.dispatchEvent(new Event("retone"));
    }
  }, [theme, loadedAt]);

  const set = <K extends keyof Theme>(key: K, value: Theme[K]) => setTheme((t) => ({ ...t, [key]: value }));
  const colour = (k: keyof Theme["colours"], v: string) => setTheme((t) => ({ ...t, colours: { ...t.colours, [k]: v } }));
  const font = (k: keyof Theme["fonts"], v: string) => setTheme((t) => ({ ...t, fonts: { ...t.fonts, [k]: v } }));

  const nameOk = validName(theme.name);
  const save = async () => {
    if (!nameOk) return;
    const res = await fetch(`${ROUTE}/${theme.name}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(theme),
    });
    if (res.ok) {
      setNote(`Saved as themes/${theme.name}.json`);
      const list = await fetchSaved();
      if (list) setSaved(list);
    } else {
      const body = (await res.json().catch(() => ({ detail: res.status }))) as { detail: string };
      setNote(`Not saved: ${body.detail}`);
    }
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${theme.name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const bodyPick = useMemo(() => BODY_STACKS.find((f) => f.body === theme.fonts.body)?.label ?? "custom", [theme.fonts.body]);
  const monoPick = useMemo(() => MONO_STACKS.find((f) => f.mono === theme.fonts.mono)?.label ?? "custom", [theme.fonts.mono]);

  return (
    <main className="mx-auto max-w-[1600px] px-6 pt-20 pb-16">
      <Heading level={1}>Theme builder</Heading>
      <Text kind="body" as="p" className="mt-2 max-w-3xl">
        A development page. Every value the site's look is built from is a control here, and the
        page at the right is the real site under those values. A version is saved as a file in the
        themes folder by its name. The product ships with one of them written into the stylesheet
        and knows nothing about themes.
      </Text>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <section className="rounded border border-edge p-4">
            <Heading level={2}>VERSIONS</Heading>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setTheme(DEFAULT)}>
                As designed
              </Button>
              {saved.map((s) => (
                <Button variant="outline" size="sm"
                  key={s.name}
                  type="button"
                  onClick={() => setTheme(s)}
                  aria-pressed={s.name === theme.name}
                >
                  {s.name}
                </Button>
              ))}
            </div>
            <label className="mt-3 grid grid-cols-[86px_1fr] items-center gap-2">
              <span data-text="note">Name</span>
              <input
                value={theme.name}
                onChange={(e) => set("name", e.target.value)}
                className="rounded border border-edge bg-transparent px-2 py-1 font-mono text-[12px] text-ink"
                spellCheck={false}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => void save()} disabled={!nameOk}>
                Save version
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={download}>
                Download file
              </Button>
            </div>
            <Text kind="note" as="p" className="mt-2">
              {nameOk ? note || "Names are letters, digits and hyphens." : "The name needs letters, digits and hyphens only, up to forty."}
            </Text>
          </section>

          <section className="rounded border border-edge p-4">
            <Heading level={2}>COLOURS</Heading>
            <div className="mt-3">
              <Choices options={SCHEMES as unknown as { id: string; label: string }[]} value={theme.scheme} onPick={(id) => set("scheme", id as Theme["scheme"])} />
            </div>
            <div className="mt-3 space-y-2">
              {COLOUR_NAMES.map((k) => (
                <div key={k} className="grid grid-cols-[86px_36px_1fr] items-center gap-2">
                  <span data-text="caption">{k}</span>
                  <input type="color" value={theme.colours[k]} onChange={(e) => colour(k, e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-edge bg-transparent" aria-label={`${k} colour`} />
                  <div>
                    <input
                      value={theme.colours[k]}
                      onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && colour(k, e.target.value.toLowerCase())}
                      className="w-24 rounded border border-edge bg-transparent px-2 py-0.5 font-mono text-[11px] text-ink"
                      spellCheck={false}
                    />
                    <div data-text="note">{COLOUR_ROLES[k]}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded border border-edge p-4">
            <Heading level={2}>TYPE</Heading>
            <div className="mt-3 space-y-3">
              <div>
                <div data-text="note">Running text</div>
                <div className="mt-1.5">
                  <Choices options={BODY_STACKS.map((f) => ({ id: f.label, label: f.label }))} value={bodyPick} onPick={(id) => font("body", BODY_STACKS.find((f) => f.label === id)?.body ?? theme.fonts.body)} />
                </div>
                <input value={theme.fonts.body} onChange={(e) => font("body", e.target.value)} className="mt-1.5 w-full rounded border border-edge bg-transparent px-2 py-1 font-mono text-[11px] text-ink" spellCheck={false} />
              </div>
              <div>
                <div data-text="note">Labels, numbers and headings</div>
                <div className="mt-1.5">
                  <Choices options={MONO_STACKS.map((f) => ({ id: f.label, label: f.label }))} value={monoPick} onPick={(id) => font("mono", MONO_STACKS.find((f) => f.label === id)?.mono ?? theme.fonts.mono)} />
                </div>
                <input value={theme.fonts.mono} onChange={(e) => font("mono", e.target.value)} className="mt-1.5 w-full rounded border border-edge bg-transparent px-2 py-1 font-mono text-[11px] text-ink" spellCheck={false} />
              </div>
              <Slider label="Size" min={0.7} max={1.6} step={0.02} value={theme.scale} format={(v) => `x${v.toFixed(2)}`} onChange={(v) => set("scale", v)} />
              <Slider label="Line height" min={1.1} max={2.2} step={0.05} value={theme.leading} format={(v) => v.toFixed(2)} onChange={(v) => set("leading", v)} />
              <Slider label="Spacing" min={-0.05} max={0.2} step={0.005} value={theme.tracking} format={(v) => `${v.toFixed(3)}em`} onChange={(v) => set("tracking", v)} />
            </div>
          </section>

          <section className="rounded border border-edge p-4">
            <Heading level={2}>SHAPE AND MOTION</Heading>
            <div className="mt-3 space-y-3">
              <Slider label="Corners" min={0} max={24} step={1} value={theme.corner} format={(v) => `${v}px`} onChange={(v) => set("corner", v)} />
              <Slider label="Borders" min={0} max={4} step={0.5} value={theme.edge} format={(v) => `${v}px`} onChange={(v) => set("edge", v)} />
              <Slider label="Density" min={0.6} max={1.6} step={0.05} value={theme.density} format={(v) => `x${v.toFixed(2)}`} onChange={(v) => set("density", v)} />
              <Choices options={MOTION as unknown as { id: string; label: string }[]} value={theme.motion ? "on" : "off"} onPick={(id) => set("motion", id === "on")} />
            </div>
          </section>

          <section className="rounded border border-edge p-4">
            <Heading level={3}>SHIPPING ONE</Heading>
            <Text kind="note" as="p" className="mt-2">
              To make a saved version the product's look, run the ship script with its name. It
              writes the values into the stylesheet's token block, and that is all the product
              ever carries.
            </Text>
            <pre className="mt-2 overflow-x-auto rounded border border-edge p-2 font-mono text-[11px] text-ink/80">npm run theme:ship -- {theme.name}</pre>
          </section>
        </div>

        <div className="space-y-2 xl:sticky xl:top-20">
          <Choices options={PAGES} value={page} onPick={setPage} />
          <div className="h-[calc(100vh-140px)] overflow-hidden rounded border border-edge">
            <iframe
              ref={frame}
              src={page}
              title="The site under this theme"
              className="h-full w-full"
              onLoad={() => setLoadedAt(Date.now())}
            />
          </div>
          <Text kind="note" as="p">The real site, at the address chosen above. Every control applies to it at once.</Text>
        </div>
      </div>
    </main>
  );
}
