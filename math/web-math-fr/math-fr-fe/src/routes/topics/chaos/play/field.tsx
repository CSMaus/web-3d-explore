import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
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
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/chaos";
import { INK, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { integrate, type Field, type Method } from "@/systems/flow";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/chaos/play/field")({
  loader: () => api.system(TOPIC, "field"),
  component: FieldPage,
});

/** three equations whose closed form is known, so the stepping can be scored. */
const KIND = {
  decay: {
    label: L("Decay"),
    rule: (k: number): Field => ([x]) => [-k * x],
    exact: (k: number, x0: number) => (t: number) => x0 * Math.exp(-k * t),
    tex: "x' = -k x",
    closed: "x(t) = x_0 e^{-kt}",
    box: { x0: 0, x1: 6, y0: -0.2, y1: 2.2 } as Box,
    start: 2,
    what: L("The quantity x falls, and the speed of the fall is k times the amount that is left. So the lower the curve goes, the flatter it gets"),
  },
  cooling: {
    label: L("Cooling"),
    rule: (k: number): Field => ([x]) => [-k * (x - 0.4)],
    exact: (k: number, x0: number) => (t: number) => 0.4 + (x0 - 0.4) * Math.exp(-k * t),
    tex: "x' = -k(x - A),\\ A = 0.4",
    closed: "x(t) = A + (x_0 - A)e^{-kt}",
    box: { x0: 0, x1: 6, y0: -0.2, y1: 2.2 } as Box,
    start: 2,
    what: L("A hot cup cooling in a room whose temperature is A = 0.4. The speed of cooling is k times the gap between the cup and the room. From any start the curve ends at 0.4"),
  },
  crowded: {
    label: L("Growth with limited room"),
    rule: (k: number): Field => ([x]) => [k * x * (1 - x)],
    exact: (k: number, x0: number) => (t: number) => x0 / (x0 + (1 - x0) * Math.exp(-k * t)),
    tex: "x' = k x (1 - x)",
    closed: "x(t) = \\dfrac{x_0}{x_0 + (1 - x_0)e^{-kt}}",
    box: { x0: 0, x1: 6, y0: -0.2, y1: 1.6 } as Box,
    start: 0.08,
    what: L("Growth with limited room, such as a population filling its land, where 1 means full. Growth is slow near 0 and near 1, and fast in between. A small start climbs slowly, then fast, then levels off at 1"),
  },
} as const;
type KindId = keyof typeof KIND;
const KINDS = (Object.keys(KIND) as KindId[]).map((id) => ({ id, label: KIND[id].label }));
const METHODS: { id: Method; label: string }[] = [
  { id: "euler", label: L("Euler's method") },
  { id: "midpoint", label: L("Midpoint method") },
  { id: "rk4", label: L("Runge-Kutta method") },
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
    <div>
      <TaskPage
        title={system?.name ?? L("One equation for change, drawn as strokes")}
        job={L("Can the future of a changing quantity be worked out from its speed of change alone? Here x is a quantity and t is time. The rule on this page gives the speed at which x changes, for every value of x. For example, with k = 0.8 the rule for decay says that x falls at a speed of 0.8 times its current value. Such a rule is called a differential equation. Its unknown is not a number but a whole curve x(t). The small arrows in the picture show, at each point, the direction the rule gives. A solution is a curve that follows the arrows everywhere. A computer finds it in steps: it reads the arrow at the current point, moves a short distance along it, and repeats. For the three rules on this page the exact curve is also known as a formula, so the error of the steps can be measured. The task: choose a start, press run, and see how far the steps drift from the exact curve.")}
        input={
          <div className="space-y-3">
            <Choices options={KINDS} value={kind} onPick={(id) => { setKind(id); setStart(KIND[id].start); reset(); }} />
            <Text kind="note" as="p">{spec.what}.</Text>
            <Slider label={L("Rate k: how fast x changes")} min={0.1} max={3} step={0.01} value={rate} format={(v) => v.toFixed(2)} onChange={(v) => { setRate(v); reset(); }} />
            <Slider label={L("Start x0: the value of x at time 0")} min={0.02} max={2} step={0.01} value={start} format={(v) => v.toFixed(2)} onChange={(v) => { setStart(v); reset(); }} />
            <Choices options={METHODS} value={how} onPick={(id) => { setHow(id); reset(); }} />
            <Slider label={L("Step h: the length of one step in time")} min={0.05} max={1} step={0.05} value={step} format={(v) => v.toFixed(2)} onChange={(v) => { setStep(v); reset(); }} />
            <Slider label={L("Number of exact curves from other starts")} min={0} max={21} step={1} value={curves} format={(v) => String(Math.round(v))} onChange={(v) => setCurves(Math.round(v))} />
            <Text kind="note" as="p">
              {L("Click the picture to choose the starting value. The method buttons choose how each step is taken. Euler's method reads the arrow at the current point and moves straight along it for a whole step. The midpoint method first looks half a step ahead and uses the arrow found there. The Runge-Kutta method reads the arrow at four places inside the step and averages them, giving the middle two more weight.")}
            </Text>
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            what={L("steps")}
            limit={count - 1}
            onToggle={() => {
              if (!runner.running && n >= count - 1) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-1"><div data-slot="plot" className="h-[min(520px,calc(100vh-18rem))] overflow-hidden">
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
          </div><Caption>{L("Small arrows: the direction the rule gives at each point. Faint thin curves: exact solutions from other starts. Thick line: the exact solution from the chosen start, drawn up to the current time. Dots joined by a thin line: the steps. Long arrow from the last dot: the direction of the next step. Short vertical segment: the error, the gap between the last step and the exact curve")}</Caption></section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={n === 0 ? undefined : errNow < 0.02 * Math.max(Math.abs(truth(tNow)), 0.05)}>
              {n === 0
                ? L("The start is x0 = {{start}}. There the rule says that x changes at a speed of {{rate}} per unit of time (a minus sign means that x falls). One step of length {{step}} along this arrow lands at {{land}}. Press run to take the steps one after another.", { start: start.toFixed(2), rate: spec.rule(rate)([start], 0)[0].toFixed(3), step: step.toFixed(2), land: (start + step * spec.rule(rate)([start], 0)[0]).toFixed(3) })
                : [
                    n === 1
                      ? L("After {{n}} step of length {{step}}, at time t = {{t}}, the step gives x = {{walked}}. The exact formula gives {{truth}}. Error: {{error}}.", { n, step: step.toFixed(2), t: tNow.toFixed(2), walked: walk[n][1].toFixed(4), truth: truth(tNow).toFixed(4), error: errNow.toExponential(2) })
                      : L("After {{n}} steps of length {{step}}, at time t = {{t}}, the steps give x = {{walked}}. The exact formula gives {{truth}}. Error: {{error}}.", { n, step: step.toFixed(2), t: tNow.toFixed(2), walked: walk[n][1].toFixed(4), truth: truth(tNow).toFixed(4), error: errNow.toExponential(2) }),
                    how === "euler" ? L("Euler's method moves straight along the arrow found at the start of each step. The exact curve bends away during the step, so every step adds a little error.") : how === "midpoint" ? L("The midpoint method first looks half a step ahead and moves along the arrow found there. So it follows the bend of the curve much more closely.") : L("The Runge-Kutta method reads the arrow at four places inside each step and averages them. Its error is far too small to see in the picture."),
                    errNow < 0.02 * Math.max(Math.abs(truth(tNow)), 0.05) ? L("The error is small next to the true value, so the result counts as correct.") : L("The error is {{share}} per cent of the true value. A shorter step makes this number smaller.", { share: (100 * errNow / Math.max(Math.abs(truth(tNow)), 1e-9)).toFixed(0) }),
                  ].join(" ")}
            </Verdict>
            <Readout
              rows={[
                [L("The rule (x' is the speed of change of x)"), spec.tex.replace(/\\/g, "")],
                [L("Exact solution, as a formula"), spec.closed.replace(/\\dfrac/g, "").replace(/[{}\\]/g, "")],
                [L("Steps taken"), L("{{n}} of {{total}}", { n, total: count - 1 })],
                [L("Error now: the gap between the last step and the exact curve"), n > 0 ? errNow.toExponential(2) : "-"],
                [L("Largest error over all steps up to the right edge"), worst.toExponential(2)],
                [L("Largest error divided by the number of steps"), (worst / (count - 1)).toExponential(2)],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("With a step half as long, the error of Euler's method also becomes about half as large. For the Runge-Kutta method it becomes about 16 times smaller. Another page of this topic measures this on a weight on a spring that comes back exactly to its start. Numbers such as 3.20e-4 are written with powers of ten: 3.20e-4 means 3.20 divided by 10 four times, that is 0.00032.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`chaos-field-${kind}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
