import { createFileRoute } from "@tanstack/react-router";
import { L } from "@/lib/lang";
import { Label, Text, Heading } from "@kit/index";
import { useCallback, useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { Frame } from "@/components/Frame";
import { PaletteBar } from "@/components/PaletteBar";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { useGrower } from "@/lib/grower";
import { useLook } from "@/lib/store";
import { boxDim } from "@/systems/ifs";
import { massDim } from "@/systems/growth";

export const Route = createFileRoute("/topics/fractals/play/dla")({
  loader: () => api.system(TOPIC, "dla"),
  component: DlaPage,
});

const SHARES = [0.1, 0.17, 0.28, 0.41, 0.59];

function DlaPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState(161);
  const [target, setTarget] = useState(1200);
  const [kill, setKill] = useState(2.5);
  const [traced, setTraced] = useState(3);
  const [seed, setSeed] = useState(11);

  const job = useMemo(
    () => ({ kind: "dla", size, target, kill, seed, traced, cap: 6000 }) as const,
    [size, target, kill, seed, traced],
  );
  const tick = useGrower(job);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = palette.back;
      ctx.fillRect(0, 0, w, h);
      if (!tick || tick.kind !== "dla") return;
      const n = tick.size;
      const half = n >> 1;
      const cell = Math.min(w, h) / n;
      const ox = (w - cell * n) / 2;
      const oy = (h - cell * n) / 2;
      const at = (i: number) => [ox + ((i % n) + 0.5) * cell, oy + (Math.floor(i / n) + 0.5) * cell];

      ctx.strokeStyle = palette.roles[0];
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(
        ox + (half + 0.5) * cell,
        oy + (half + 0.5) * cell,
        Math.min(tick.radius + 2, half) * cell,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = palette.roles[3] ?? palette.ink;
      ctx.globalAlpha = 0.42;
      for (const track of tick.tracks) {
        ctx.beginPath();
        for (let i = 0; i < track.length; i++) {
          const [px, py] = at(track[i]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = palette.roles[1] ?? palette.ink;
      const side = Math.max(1, cell);
      for (let i = 0; i < tick.order.length; i++) {
        const p = tick.order[i];
        ctx.fillRect(ox + (p % n) * cell, oy + Math.floor(p / n) * cell, side, side);
      }
      const [sx, sy] = at(tick.order[0]);
      ctx.fillStyle = palette.roles[2] ?? palette.ink;
      ctx.fillRect(sx - side, sy - side, side * 2, side * 2);
    },
    [tick, palette],
  );

  const numbers = useMemo(() => {
    if (!tick) return { mass: null as number | null, box: null as number | null, steps: 0 };
    const order = Array.from(tick.order);
    const mass = massDim(order, tick.size, SHARES);
    const xs = new Float64Array(order.length);
    const ys = new Float64Array(order.length);
    for (let i = 0; i < order.length; i++) {
      xs[i] = order[i] % tick.size;
      ys[i] = Math.floor(order[i] / tick.size);
    }
    const box = boxDim(xs, ys, order.length, { least: 120, cuts: [2, 4, 8, 16] });
    const steps = tick.tracks.reduce((a, t) => a + t.length, 0);
    return { mass, box, steps };
  }, [tick]);

  return (
    <div>
      <Heading level={1} className="mt-4">{system?.name ?? L("Wandering particles")}</Heading>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section data-slot="panel">
            <Label>{L("WALK")}</Label>
            <div className="mt-3 space-y-2">
              <Slider label={L("Particles")} min={200} max={4000} step={100} value={target} format={(v) => String(Math.round(v))} onChange={(v) => setTarget(Math.round(v))} />
              <Slider label={L("Grid width")} min={81} max={201} step={10} value={size} format={(v) => String(Math.round(v) | 1)} onChange={(v) => setSize(Math.round(v) | 1)} />
              <Slider label={L("Drift limit")} min={1.5} max={4} step={0.1} value={kill} format={(v) => L("{{v}} x r", { v: v.toFixed(1) })} onChange={setKill} />
              <Slider label={L("Walks shown")} min={0} max={6} step={1} value={traced} format={(v) => String(Math.round(v))} onChange={(v) => setTraced(Math.round(v))} />
              <Slider label={L("Seed")} min={1} max={200} step={1} value={seed} format={(v) => String(Math.round(v))} onChange={(v) => setSeed(Math.round(v))} />
              <PaletteBar />
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("A particle starts on the ring, steps to one of four neighbours with chance a quarter each, and stops the moment it touches the cluster. Let go at is how far it may drift before it is abandoned and another is released. Walks kept draws the paths the last few particles actually took.")}
            </Text>
          </section>

          <Equations system={system} />
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section ref={stage} data-slot="plot" className="h-[min(620px,calc(100vh-12rem))] overflow-hidden" style={{ background: palette.back }}>
            <Frame draw={draw} className="block h-full w-full" />
          </section>
          <SaveImage stage={stage} name="wandering-particles" />
          <Readout
            rows={[
              [L("Particles stuck"), tick ? L("{{stuck}} of {{target}}", { stuck: tick.order.length.toLocaleString(), target }) : L("starting")],
              [L("reach"), tick ? L("{{r}} cells of {{half}}", { r: tick.radius.toFixed(0), half: size >> 1 }) : "-"],
              [L("mass-radius dimension"), numbers.mass ? numbers.mass.toFixed(3) : "-"],
              [L("Box dimension"), numbers.box ? numbers.box.toFixed(3) : "-"],
              [
                L("Walks drawn"),
                tick && tick.tracks.length
                  ? L("{{walks}}, {{steps}} steps between them", { walks: tick.tracks.length, steps: numbers.steps.toLocaleString() })
                  : "-",
              ],
              [L("state"), tick?.done ? L("The cluster reached the edge") : tick?.finished ? L("finished") : L("growing")],
            ]}
          />
        </div>
      </div>
    </div>
  );
}
