import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ChaosTabs } from "@/components/ChaosTabs";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { PaletteBar } from "@/components/PaletteBar";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { CHAOS, TOPIC } from "@/lib/chaos";
import { INK, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { integrate, type Field, type Method } from "@/systems/flow";

export const Route = createFileRoute("/topics/chaos/play/field")({
  loader: () => api.system(TOPIC, "field"),
  component: FieldPage,
});

/** three equations whose closed form is known, so the stepping can be scored. */
const KIND = {
  decay: {
    label: "Decay",
    rule: (k: number): Field => ([x]) => [-k * x],
    exact: (k: number, x0: number) => (t: number) => x0 * Math.exp(-k * t),
    tex: "x' = -k x",
    closed: "x(t) = x_0 e^{-kt}",
    box: { x0: 0, x1: 6, y0: -0.2, y1: 2.2 } as Box,
    start: 2,
    what: "The rate of loss is a fixed fraction of what is left. The further down the curve, the flatter it gets",
  },
  cooling: {
    label: "Cooling",
    rule: (k: number): Field => ([x]) => [-k * (x - 0.4)],
    exact: (k: number, x0: number) => (t: number) => 0.4 + (x0 - 0.4) * Math.exp(-k * t),
    tex: "x' = -k(x - A),\\ A = 0.4",
    closed: "x(t) = A + (x_0 - A)e^{-kt}",
    box: { x0: 0, x1: 6, y0: -0.2, y1: 2.2 } as Box,
    start: 2,
    what: "The same, towards the temperature of the room rather than towards zero. Every start ends at 0.4",
  },
  crowded: {
    label: "Crowded growth",
    rule: (k: number): Field => ([x]) => [k * x * (1 - x)],
    exact: (k: number, x0: number) => (t: number) => x0 / (x0 + (1 - x0) * Math.exp(-k * t)),
    tex: "x' = k x (1 - x)",
    closed: "x(t) = \\dfrac{x_0}{x_0 + (1 - x_0)e^{-kt}}",
    box: { x0: 0, x1: 6, y0: -0.2, y1: 1.6 } as Box,
    start: 0.08,
    what: "Growth that slows as it fills. Small starts climb slowly, then fast, then level off at one",
  },
} as const;
type KindId = keyof typeof KIND;
const KINDS = (Object.keys(KIND) as KindId[]).map((id) => ({ id, label: KIND[id].label }));
const METHODS: { id: Method; label: string }[] = [
  { id: "euler", label: "Euler: follow the stroke" },
  { id: "midpoint", label: "Midpoint" },
  { id: "rk4", label: "Runge-Kutta" },
];

function FieldPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);

  const [kind, setKind] = useState<KindId>("decay");
  const [rate, setRate] = useState(0.8);
  const [start, setStart] = useState<number>(KIND.decay.start);
  const [step, setStep] = useState(0.4);
  const [how, setHow] = useState<Method>("euler");
  const [curves, setCurves] = useState(11);
  const [taken, setTaken] = useState(0);
  const [perFrame, setPerFrame] = useState(0.15);

  const spec = KIND[kind];
  const box = spec.box;
  const count = Math.max(2, Math.round((box.x1 - box.x0) / step) + 1);
  const runner = useRunner((n) => setTaken(n), { perFrame, stopAt: count - 1 });
  const n = Math.min(taken, count - 1);

  const walk = useMemo(() => {
    const p = integrate(spec.rule(rate), [start], step, count, how);
    const pts: [number, number][] = [];
    for (let i = 0; i < p.count; i++) pts.push([i * step, p.xs[i]]);
    return pts;
  }, [spec, rate, start, step, how, count]);
  const truth = useMemo(() => spec.exact(rate, start), [spec, rate, start]);
  const tNow = n * step;
  const errNow = n > 0 ? Math.abs(walk[n][1] - truth(tNow)) : 0;
  const worst = useMemo(() => walk.reduce((m, [t, v]) => Math.max(m, Math.abs(v - truth(t))), 0), [walk, truth]);

  const ink = palette.ramp[palette.ramp.length - 1] ?? palette.ink;
  const accent = palette.roles[0] ?? ink;
  const other = palette.roles[2] ?? ink;
  const reset = () => {
    runner.reset();
    setTaken(0);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={CHAOS} />
      <div className="mt-4">
        <ChaosTabs />
      </div>
      <TaskPage
        title={system?.name ?? "One equation, and its field"}
        job="An equation that says, at every state and time, how fast the state is changing, and nothing else. Drawn as short strokes it is a field, and a solution is any curve that follows the strokes. The job is to pick a start, step along the strokes, and see how far the stepping drifts from the true curve, which for these three equations is known exactly."
        input={
          <div className="space-y-3">
            <Choices options={KINDS} value={kind} onPick={(id) => { setKind(id); setStart(KIND[id].start); reset(); }} />
            <p className="text-[11px] text-muted">{spec.what}.</p>
            <Slider label="Rate k" min={0.1} max={3} step={0.01} value={rate} format={(v) => v.toFixed(2)} onChange={(v) => { setRate(v); reset(); }} />
            <Slider label="Start x0" min={0.02} max={2} step={0.01} value={start} format={(v) => v.toFixed(2)} onChange={(v) => { setStart(v); reset(); }} />
            <Choices options={METHODS} value={how} onPick={(id) => { setHow(id); reset(); }} />
            <Slider label="Step h" min={0.05} max={1} step={0.05} value={step} format={(v) => v.toFixed(2)} onChange={(v) => { setStep(v); reset(); }} />
            <Slider label="Curves shown" min={0} max={21} step={1} value={curves} format={(v) => String(Math.round(v))} onChange={(v) => setCurves(Math.round(v))} />
            <p className="text-[11px] text-muted">
              Click the picture to choose the start. Euler reads the stroke where it stands and
              walks straight along it for one step; the other two look ahead inside the step first.
            </p>
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            what="steps"
            limit={count - 1}
            onToggle={() => {
              if (!runner.running && n >= count - 1) reset();
              runner.toggle();
            }}
            onStep={(many) => setTaken((v) => Math.min(count - 1, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-1"><div className="h-[min(520px,calc(100vh-18rem))] overflow-hidden rounded border border-edge">
            <Plot
              className="h-full w-full"
              box={box}
              deps={[kind, rate, start, step, how, curves, n, palette]}
              onPick={(_x, y) => {
                setStart(Math.max(0.02, Math.min(2, y)));
                reset();
              }}
              draw={(pen) => {
                ticks(pen);
                const f = spec.rule(rate);
                pen.axes("#23262c", 6);
                const cols = 26;
                const rows = 18;
                const cw = (box.x1 - box.x0) / cols;
                const ch = (box.y1 - box.y0) / rows;
                for (let i = 0; i < cols; i++) {
                  for (let k = 0; k < rows; k++) {
                    const x = box.x0 + cw * (i + 0.5);
                    const y = box.y0 + ch * (k + 0.5);
                    const slope = f([y], x)[0];
                    const dx = cw * 0.72;
                    const dy = slope * dx;
                    const shrink = Math.min(1, (ch * 0.72) / (Math.abs(dy) || 1e-9));
                    pen.arrow(x - (dx * shrink) / 2, y - (dy * shrink) / 2, dx * shrink, dy * shrink, "#3c4450");
                  }
                }
                for (let i = 0; i < curves; i++) {
                  const y0 = box.y0 + ((box.y1 - box.y0) * (i + 0.5)) / curves;
                  const g = spec.exact(rate, y0);
                  const pts: [number, number][] = [];
                  for (let t = box.x0; t <= box.x1; t += (box.x1 - box.x0) / 240) pts.push([t, g(t)]);
                  pen.line(pts, "#2b3a4a", 1);
                }
                // the true curve, traced as far as the stepping has got
                const pts: [number, number][] = [];
                for (let t = box.x0; t <= tNow + 1e-9; t += (box.x1 - box.x0) / 400) pts.push([t, truth(t)]);
                pts.push([tNow, truth(tNow)]);
                pen.line(pts, accent, 2);
                const rest: [number, number][] = [];
                for (let t = tNow; t <= box.x1; t += (box.x1 - box.x0) / 400) rest.push([t, truth(t)]);
                pen.line(rest, "#243a2c", 1);
                // the stepping so far, and the stroke it is about to follow
                pen.line(walk.slice(0, n + 1), other, 1.2);
                for (let i = 0; i <= n; i++) pen.dot(walk[i][0], walk[i][1], 3, other);
                if (n < count - 1) {
                  const [t, v] = walk[n];
                  const slope = f([v], t)[0];
                  pen.arrow(t, v, step, slope * step, INK);
                }
                if (n > 0) pen.line([[tNow, walk[n][1]], [tNow, truth(tNow)]], "#c75ab0", 1.5);
                pen.dot(0, start, 5, INK);
              }}
            />
          </div><Caption>Green: the true curve.  Dots: the steps.  White arrow: the stroke under the last step.  Rose: the error</Caption></section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={n === 0 ? undefined : errNow < 0.02 * Math.max(Math.abs(truth(tNow)), 0.05)}>
              {n === 0
                ? `Start at ${start.toFixed(2)}. The stroke there says the rate is ${spec.rule(rate)([start], 0)[0].toFixed(3)} a time unit, so a step of ${step.toFixed(2)} along it lands at ${(start + step * spec.rule(rate)([start], 0)[0]).toFixed(3)}. Press run.`
                : `After ${n} step${n === 1 ? "" : "s"} of ${step.toFixed(2)}, at t = ${tNow.toFixed(2)}, the stepping says ${walk[n][1].toFixed(4)} and the true curve says ${truth(tNow).toFixed(4)}: off by ${errNow.toExponential(2)}. ${how === "euler" ? "Euler follows the stroke where it stands, and the true curve bends away underneath it before the step is over; every step adds a little of that." : how === "midpoint" ? "The midpoint rule looks half a step ahead and uses the stroke there, so it follows the bend much more closely." : "Runge-Kutta samples the stroke four times inside each step and weighs them; the error is far below what the picture can show."} ${errNow < 0.02 * Math.max(Math.abs(truth(tNow)), 0.05) ? "Close enough to call right." : `That is ${(100 * errNow / Math.max(Math.abs(truth(tNow)), 1e-9)).toFixed(0)} per cent of the true value. Narrow the step and watch this number.`}`}
            </Verdict>
            <Readout
              rows={[
                ["The equation", spec.tex.replace(/\\/g, "")],
                ["Closed form", spec.closed.replace(/\\dfrac/g, "").replace(/[{}\\]/g, "")],
                ["Steps taken", `${n} of ${count - 1}`],
                ["Error now", n > 0 ? errNow.toExponential(2) : "-"],
                ["Worst error over the whole run", worst.toExponential(2)],
                ["Error per step, on average", (worst / (count - 1)).toExponential(2)],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              Halve the step and Euler's error halves; halve it for Runge-Kutta and the error falls
              sixteenfold. The next page measures that on an equation whose answer comes back to
              its start exactly.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`chaos-field-${kind}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
