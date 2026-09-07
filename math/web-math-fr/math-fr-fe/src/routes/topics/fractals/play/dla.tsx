import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
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
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={FRACTALS} />
      <div className="mt-4">
        <PlayTabs />
      </div>
      <h1 className="font-mono text-sm tracking-wide text-leaf">{system?.name ?? "wandering particles"}</h1>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">WALK</h2>
            <div className="mt-3 space-y-2">
              <Slider label="particles" min={200} max={4000} step={100} value={target} format={(v) => String(Math.round(v))} onChange={(v) => setTarget(Math.round(v))} />
              <Slider label="grid width" min={81} max={201} step={10} value={size} format={(v) => String(Math.round(v) | 1)} onChange={(v) => setSize(Math.round(v) | 1)} />
              <Slider label="drift limit" min={1.5} max={4} step={0.1} value={kill} format={(v) => `${v.toFixed(1)} x r`} onChange={setKill} />
              <Slider label="walks shown" min={0} max={6} step={1} value={traced} format={(v) => String(Math.round(v))} onChange={(v) => setTraced(Math.round(v))} />
              <Slider label="seed" min={1} max={200} step={1} value={seed} format={(v) => String(Math.round(v))} onChange={(v) => setSeed(Math.round(v))} />
              <PaletteBar />
            </div>
            <p className="mt-3 text-[11px] text-muted">
              a particle starts on the ring, steps to one of four neighbours with chance a quarter
              each, and stops the moment it touches the cluster. let go at is how far it may drift
              before it is abandoned and another is released. walks kept draws the paths the last
              few particles actually took.
            </p>
          </section>

          <Equations system={system} />
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section ref={stage} className="h-[min(620px,calc(100vh-12rem))] overflow-hidden rounded border border-edge" style={{ background: palette.back }}>
            <Frame draw={draw} className="block h-full w-full" />
          </section>
          <SaveImage stage={stage} name="wandering-particles" />
          <Readout
            rows={[
              ["particles stuck", tick ? `${tick.order.length.toLocaleString()} of ${target}` : "starting"],
              ["reach", tick ? `${tick.radius.toFixed(0)} cells of ${size >> 1}` : "-"],
              ["mass-radius dimension", numbers.mass ? numbers.mass.toFixed(3) : "-"],
              ["box dimension", numbers.box ? numbers.box.toFixed(3) : "-"],
              [
                "walks drawn",
                tick && tick.tracks.length
                  ? `${tick.tracks.length}, ${numbers.steps.toLocaleString()} steps between them`
                  : "-",
              ],
              ["state", tick?.done ? "the cluster reached the edge" : tick?.finished ? "finished" : "growing"],
            ]}
          />
        </div>
      </div>
    </main>
  );
}
