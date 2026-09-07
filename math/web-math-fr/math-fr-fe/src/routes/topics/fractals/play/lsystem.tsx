import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Chips } from "@/components/Chips";
import { Equations } from "@/components/Equations";
import { Frame } from "@/components/Frame";
import { PaletteBar } from "@/components/PaletteBar";
import { PlayTabs } from "@/components/PlayTabs";
import { TopicBar } from "@/components/TopicBar";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { FRACTALS } from "@/lib/topic";
import { useLook } from "@/lib/store";
import { LSYS_PRESETS, expand, parseRules, rngFrom, turtle } from "@/systems/lsystem";

export const Route = createFileRoute("/topics/fractals/play/lsystem")({
  loader: () => api.system(TOPIC, "lsystem"),
  component: LsystemPage,
});

const CAP = 900000;

function LsystemPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);
  const [preset, setPreset] = useState("plant");
  const [axiom, setAxiom] = useState(LSYS_PRESETS.plant.axiom);
  const [rules, setRules] = useState(LSYS_PRESETS.plant.rules);
  const [angle, setAngle] = useState(LSYS_PRESETS.plant.angle);
  const [passes, setPasses] = useState(LSYS_PRESETS.plant.passes);
  const [jitter, setJitter] = useState(0);
  const [seed, setSeed] = useState(7);

  const grown = useMemo(
    () => expand(axiom, parseRules(rules), passes, CAP),
    [axiom, rules, passes],
  );
  const segs = useMemo(
    () => turtle(grown.word, angle, jitter, rngFrom(seed)),
    [grown.word, angle, jitter, seed],
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = palette.back;
      ctx.fillRect(0, 0, w, h);
      if (!segs.length) return;
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      let deep = 0;
      for (const s of segs) {
        x0 = Math.min(x0, s.x0, s.x1);
        x1 = Math.max(x1, s.x0, s.x1);
        y0 = Math.min(y0, s.y0, s.y1);
        y1 = Math.max(y1, s.y0, s.y1);
        if (s.depth > deep) deep = s.depth;
      }
      const pad = 0.06;
      const sx = x1 - x0 || 1;
      const sy = y1 - y0 || 1;
      const k = Math.min((w * (1 - 2 * pad)) / sx, (h * (1 - 2 * pad)) / sy);
      const ox = (w - sx * k) / 2 - x0 * k;
      const oy = h - (h - sy * k) / 2 + y0 * k;
      const thin = segs.length > 40000;
      const roles = palette.roles;
      ctx.lineCap = "round";
      for (const s of segs) {
        const t = deep ? s.depth / deep : 0;
        ctx.strokeStyle = roles[Math.min(roles.length - 1, Math.floor(t * roles.length))];
        ctx.lineWidth = thin ? 0.6 : Math.max(0.7, 2.4 - 1.7 * t);
        ctx.beginPath();
        ctx.moveTo(s.x0 * k + ox, oy - s.y0 * k);
        ctx.lineTo(s.x1 * k + ox, oy - s.y1 * k);
        ctx.stroke();
      }
    },
    [segs, palette],
  );

  const pickPreset = (name: string) => {
    const cfg = LSYS_PRESETS[name];
    setPreset(name);
    setAxiom(cfg.axiom);
    setRules(cfg.rules);
    setAngle(cfg.angle);
    setPasses(cfg.passes);
  };

  const deepest = segs.reduce((a, s) => Math.max(a, s.depth), 0);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={FRACTALS} />
      <div className="mt-4">
        <PlayTabs />
      </div>
      <h1 className="font-mono text-sm tracking-wide text-leaf">{system?.name ?? "rewriting systems"}</h1>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">PRESET</h2>
            <div className="mt-3">
              <Chips items={Object.keys(LSYS_PRESETS)} active={preset} onPick={pickPreset} />
            </div>
          </section>

          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">AXIOM AND RULES</h2>
            <div className="mt-3 space-y-2">
              <input
                value={axiom}
                onChange={(e) => setAxiom(e.target.value)}
                spellCheck={false}
                className="w-full rounded border border-edge bg-ground px-2 py-1 font-mono text-xs text-ink outline-none focus:border-leaf"
              />
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                spellCheck={false}
                rows={3}
                className="w-full resize-y rounded border border-edge bg-ground px-2 py-1 font-mono text-xs text-ink outline-none focus:border-leaf"
              />
              <p className="text-[11px] text-muted">
                one rule a line, as symbol = replacement. any capital letter draws a step except X
                and Y, which only carry the rule along. plus and minus turn, brackets remember and
                return to a point.
              </p>
            </div>
          </section>

          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">TURTLE</h2>
            <div className="mt-3 space-y-2">
              <Slider
                label="azimuth"
                min={0}
                max={120}
                step={0.5}
                value={angle}
                format={(v) => `${v.toFixed(1)} deg`}
                onChange={setAngle}
              />
              <Slider
                label="passes"
                min={0}
                max={14}
                step={1}
                value={passes}
                format={(v) => String(Math.round(v))}
                onChange={(v) => setPasses(Math.round(v))}
              />
              <Slider
                label="jitter"
                min={0}
                max={0.6}
                step={0.01}
                value={jitter}
                format={(v) => v.toFixed(2)}
                onChange={setJitter}
              />
              <Slider
                label="seed"
                min={1}
                max={200}
                step={1}
                value={seed}
                format={(v) => String(Math.round(v))}
                onChange={(v) => setSeed(Math.round(v))}
              />
              <PaletteBar />
            </div>
          </section>

          <Equations system={system} />
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section
            ref={stage}
            className="h-[min(620px,calc(100vh-12rem))] overflow-hidden rounded border border-edge"
            style={{ background: palette.back }}
          >
            <Frame draw={draw} className="block h-full w-full" />
          </section>
          <SaveImage stage={stage} name="rewriting" />
          <Readout
            rows={[
              ["word length", grown.word.length.toLocaleString()],
              ["segments", segs.length.toLocaleString()],
              ["passes drawn", `${grown.reached} of ${passes}`],
              ["deepest branch", String(deepest)],
            ]}
          />
          {grown.capped ? (
            <p className="text-xs text-warn">
              the word passed the limit, so it stopped expanding early - lower the passes
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
