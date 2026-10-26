import { useState } from "react";
import { Choices, caseLabel } from "@kit/index";
import { cases, type CaseName } from "../../../../ui-kit/config/cases";
import { EDGE, INK, MUTED, ONE, SKY } from "@/lib/draw";
import { L } from "@/lib/lang";
import { useClock } from "./clock";
import { Live } from "./Live";
import { ease, fill, outline, say } from "./paint";

/**
 * the figures of the ui kit: one small piece of interface drawn from each design's own config
 * (its colours for the light and the dark page, its button shape, its panel corners and type),
 * the folder of scripts a design is, and the one stylesheet they become.
 */

const NAMES = Object.keys(cases) as CaseName[];
type Mode = "light" | "dark";

function radius(name: CaseName): { button: string; panel: number } {
  const t = cases[name];
  const corner = t.panels.corner;
  const shape = t.buttons.shape;
  return { button: shape === "pill" ? "999px" : shape === "rounded" ? `${corner / 2}px` : "0px", panel: corner };
}

/** a slider, two buttons and a readout, dressed only from a design's config */
function Mock({ name, mode, small = false }: { name: CaseName; mode: Mode; small?: boolean }) {
  const t = cases[name];
  const c = t.colours[mode] as Record<string, string | string[] | undefined>;
  const colour = (k: string, fallback?: string) => (typeof c[k] === "string" ? (c[k] as string) : (fallback ?? (c.primary as string)));
  const r = radius(name);
  const pad = small ? 10 : 16;
  return (
    <div
      style={{
        background: colour("background"),
        color: colour("foreground"),
        fontFamily: t.type.fonts.body,
        padding: pad,
        borderRadius: 8,
        height: "100%",
        transition: "background 400ms ease, color 400ms ease",
      }}
    >
      <div
        style={{
          background: colour("card"),
          border: `${Math.max(1, t.panels.border)}px solid ${colour("border")}`,
          borderRadius: r.panel,
          padding: pad,
          transition: "all 400ms ease",
        }}
      >
        <div style={{ fontSize: small ? 10 : 11, letterSpacing: "0.08em", textTransform: "uppercase", color: colour("muted-foreground") }}>{L("What goes in")}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: small ? 6 : 10, fontSize: small ? 11 : 13 }}>
          <span>{L("Step size")}</span>
          <span style={{ color: colour("value") }}>0.25</span>
        </div>
        <div style={{ position: "relative", height: 4, marginTop: 8, background: colour("border"), borderRadius: 2 }}>
          <div style={{ position: "absolute", inset: 0, width: "40%", background: colour("primary"), borderRadius: 2 }} />
          <div style={{ position: "absolute", left: "40%", top: -5, width: 14, height: 14, marginLeft: -7, borderRadius: 7, background: colour("foreground") }} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: small ? 10 : 16 }}>
          <span style={{ padding: small ? "3px 10px" : "6px 14px", borderRadius: r.button, background: colour("primary"), color: colour("primary-foreground", colour("background")), fontSize: small ? 11 : 13, boxShadow: `0 0 12px ${colour("glow")}55` }}>{L("Run")}</span>
          <span style={{ padding: small ? "3px 10px" : "6px 14px", borderRadius: r.button, border: `1px solid ${colour("border")}`, fontSize: small ? 11 : 13 }}>{L("Reset")}</span>
        </div>
      </div>
    </div>
  );
}

export function KitThumb() {
  const [t, host] = useClock(0, 2);
  const name = NAMES[Math.floor(t / 2.5) % NAMES.length];
  const mode: Mode = Math.floor(t / 2.5 / NAMES.length) % 2 ? "light" : "dark";
  return (
    <div ref={host} role="img" aria-label={L("The same piece of interface in each design of the kit")} className="h-full p-3">
      <Mock name={name} mode={mode} small />
    </div>
  );
}

export function KitHero() {
  const [name, setName] = useState<CaseName>(NAMES.includes("edge_light") ? "edge_light" : NAMES[0]);
  const [mode, setMode] = useState<Mode>("dark");
  const t = cases[name];
  const c = t.colours[mode] as Record<string, unknown>;
  const lines = [
    `// ui-kit/config/${name}/colours.ts`,
    `${mode}: {`,
    `  background: "${String(c.background)}",`,
    `  card: "${String(c.card)}",`,
    `  primary: "${String(c.primary)}",`,
    `}`,
    `// ui-kit/config/${name}/buttons.ts`,
    `shape: "${t.buttons.shape}",`,
    `// ui-kit/config/${name}/panels.ts`,
    `corner: ${t.panels.corner},`,
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Choices options={NAMES.map((n) => ({ id: n, label: caseLabel(n) }))} value={name} onPick={(id) => setName(id as CaseName)} />
        <Choices options={[{ id: "light", label: L("Light") }, { id: "dark", label: L("Dark") }]} value={mode} onPick={(id) => setMode(id as Mode)} />
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="h-[260px] sm:h-[300px]">
          <Mock name={name} mode={mode} />
        </div>
        <pre data-text="note" className="m-0 h-[260px] overflow-auto rounded-lg border p-4 sm:h-[300px]" style={{ borderColor: "var(--c-border)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", lineHeight: 1.7 }}>
          {lines.join("\n")}
        </pre>
      </div>
    </div>
  );
}

const SCRIPTS = ["colours.ts", "type.ts", "text.ts", "page.ts", "topbar.ts", "buttons.ts", "tabs.ts", "sliders.ts", "inputs.ts", "panels.ts", "plots.ts", "figures.ts", "motion.ts"];

/** the folder of one design, each script lighting up in turn */
export function KitFolder() {
  return (
    <Live
      label={L("The folder of one design: thirteen scripts, one for each part of the look")}
      still={1}
      draw={(pen, t) => {
        const on = Math.floor(t * 1.2) % SCRIPTS.length;
        say(pen, "ui-kit/config/edge_light/", 0.5, 8.1, MUTED, { size: 12, mono: true });
        SCRIPTS.forEach((s, i) => {
          const col = Math.floor(i / 7);
          const row = i % 7;
          const x = 0.9 + col * 5;
          const y = 6.9 - row * 0.95;
          if (i === on) fill(pen, x - 0.3, y - 0.3, 4.4, 0.85, ONE, 0.18);
          say(pen, s, x, y, i === on ? ONE : INK, { size: 12, mono: true });
        });
        outline(pen, 11, 2, 4.5, 4.6, EDGE, 1, 6);
        const k = (Math.floor(t * 1.2) % SCRIPTS.length) / SCRIPTS.length;
        fill(pen, 11.5, 5.4, 3.5, 0.5, ONE, 0.4 + 0.5 * k);
        fill(pen, 11.5, 4.2, 2.2, 0.5, SKY, 0.4 + 0.5 * (1 - k));
        fill(pen, 11.5, 3, 3, 0.5, MUTED, 0.5);
        say(pen, SCRIPTS[on], 13.25, 1.3, ONE, { size: 11, mono: true, align: "center" });
      }}
    />
  );
}

/** the scripts becoming one stylesheet, and the stylesheet dressing the components */
export function KitSheet() {
  return (
    <Live
      label={L("The scripts generate one stylesheet, and every component reads it")}
      still={2}
      draw={(pen, t) => {
        const cycle = (t % 4) / 4;
        for (let i = 0; i < 5; i++) outline(pen, 0.5, 1.2 + i * 1.3, 3.2, 0.9, EDGE, 1, 3);
        say(pen, L("scripts"), 2.1, 8, MUTED, { size: 11, align: "center" });
        pen.line([[3.9, 4.4], [6.4, 4.4]], EDGE, 1);
        fill(pen, 3.9 + 2.3 * ease(cycle, 0, 0.4), 4.25, 0.3, 0.3, ONE);
        outline(pen, 6.6, 3.2, 3, 2.4, ONE, 1.4, 4);
        say(pen, "theme.css", 8.1, 4.25, INK, { size: 12, mono: true, align: "center" });
        say(pen, L("generated"), 8.1, 2.6, MUTED, { size: 11, align: "center" });
        pen.line([[9.8, 4.4], [12, 4.4]], EDGE, 1);
        fill(pen, 9.8 + 2 * ease(cycle, 0.45, 0.8), 4.25, 0.3, 0.3, ONE);
        for (let i = 0; i < 3; i++) {
          const lit = ease(cycle, 0.8, 0.9);
          outline(pen, 12.3, 1.6 + i * 2.2, 3.2, 1.6, lit > 0 ? ONE : EDGE, 1, 4);
        }
        say(pen, L("components"), 13.9, 8, MUTED, { size: 11, align: "center" });
      }}
    />
  );
}

/** the same piece of interface passing through every design */
export function KitCases() {
  const [t, host] = useClock(0, 2);
  const name = NAMES[Math.floor(t / 2) % NAMES.length];
  return (
    <div ref={host} role="img" aria-label={L("The same piece of interface in each design of the kit")} className="aspect-[16/9] w-full">
      <Mock name={name} mode={Math.floor(t / 2 / NAMES.length) % 2 ? "light" : "dark"} />
    </div>
  );
}
