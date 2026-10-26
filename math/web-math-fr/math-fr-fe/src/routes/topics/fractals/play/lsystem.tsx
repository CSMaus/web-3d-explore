import { createFileRoute } from "@tanstack/react-router";
import { L } from "@/lib/lang";
import { Label, Input, Textarea, Text, Heading } from "@kit/index";
import { useCallback, useMemo, useRef, useState } from "react";
import { Chips } from "@/components/Chips";
import { Equations } from "@/components/Equations";
import { Frame } from "@/components/Frame";
import { PaletteBar } from "@/components/PaletteBar";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
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
    <div>
      <Heading level={1} className="mt-4">{system?.name ?? L("Rewriting systems")}</Heading>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section data-slot="panel">
            <Label>{L("PRESET")}</Label>
            <div className="mt-3">
              <Chips items={Object.keys(LSYS_PRESETS).map((k) => L(k))} active={L(preset)} onPick={(item) => pickPreset(Object.keys(LSYS_PRESETS).find((k) => L(k) === item) ?? item)} />
            </div>
          </section>

          <section data-slot="panel">
            <Label>{L("AXIOM AND RULES")}</Label>
            <div className="mt-3 space-y-2">
              <Input
                value={axiom}
                onChange={(e) => setAxiom(e.target.value)}
                spellCheck={false}
                aria-label={L("Axiom, the starting string")}
              />
              <Textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                spellCheck={false}
                rows={3}
                aria-label={L("Rules, one a line")}
              />
              <Text kind="note" as="p">
                {L("One rule a line, as symbol = replacement. Any capital letter draws a step except X and Y, which only carry the rule along. Plus and minus turn, brackets remember and return to a point.")}
              </Text>
            </div>
          </section>

          <section data-slot="panel">
            <Label>{L("TURTLE")}</Label>
            <div className="mt-3 space-y-2">
              <Slider
                label={L("Azimuth")}
                min={0}
                max={120}
                step={0.5}
                value={angle}
                format={(v) => L("{{v}} deg", { v: v.toFixed(1) })}
                onChange={setAngle}
              />
              <Slider
                label={L("Passes")}
                min={0}
                max={14}
                step={1}
                value={passes}
                format={(v) => String(Math.round(v))}
                onChange={(v) => setPasses(Math.round(v))}
              />
              <Slider
                label={L("Jitter")}
                min={0}
                max={0.6}
                step={0.01}
                value={jitter}
                format={(v) => v.toFixed(2)}
                onChange={setJitter}
              />
              <Slider
                label={L("Seed")}
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
            data-slot="plot"
            className="h-[min(620px,calc(100vh-12rem))] overflow-hidden"
            style={{ background: palette.back }}
          >
            <Frame draw={draw} className="block h-full w-full" />
          </section>
          <SaveImage stage={stage} name="rewriting" />
          <Readout
            rows={[
              [L("Word length"), grown.word.length.toLocaleString()],
              [L("segments"), segs.length.toLocaleString()],
              [L("Passes drawn"), L("{{reached}} of {{passes}}", { reached: grown.reached, passes })],
              [L("Deepest branch"), String(deepest)],
            ]}
          />
          {grown.capped ? (
            <Text kind="warning" as="p">
              {L("The word passed the limit, so it stopped expanding early - lower the passes")}
            </Text>
          ) : null}
        </div>
      </div>
    </div>
  );
}
