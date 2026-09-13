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
import { FAINT, INK, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { SEED, cobweb, compose, exponent, logistic, logisticSlope, orbit, period } from "@/systems/maps";

export const Route = createFileRoute("/topics/chaos/play/logistic")({
  loader: () => api.system(TOPIC, "logistic"),
  component: LogisticPage,
});

const UNIT: Box = { x0: -0.02, x1: 1.02, y0: -0.02, y1: 1.02 };
const MOST = 120;
const TWIN = 1e-6;
const PRESETS = [
  { id: "2.8", label: "Settles" },
  { id: "3.2", label: "Two values" },
  { id: "3.5", label: "Four" },
  { id: "3.56995", label: "The edge" },
  { id: "3.7", label: "Chaos" },
  { id: "3.83", label: "A window" },
  { id: "4", label: "r = 4" },
];

function LogisticPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);

  const [r, setR] = useState(2.8);
  const [x0, setX0] = useState(0.2);
  const [iterate, setIterate] = useState(1);
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(0.15);

  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: MOST });
  const n = Math.min(shown, MOST);

  const m = useMemo(() => logistic(r), [r]);
  const composed = useMemo(() => compose(m, iterate), [m, iterate]);
  const rungs = useMemo(() => cobweb(composed, x0, n), [composed, x0, n]);
  const series = useMemo(() => orbit(m, x0, MOST + 1), [m, x0]);
  const twin = useMemo(() => orbit(m, Math.min(0.99, x0 + TWIN), MOST + 1), [m, x0]);
  const settled = useMemo(() => orbit(m, SEED, 400, 6000), [m]);
  const cycle = useMemo(() => period(settled), [settled]);
  const lambda = useMemo(() => exponent(logistic, logisticSlope, r), [r]);
  const fixed = r > 1 ? 1 - 1 / r : 0;
  const xNow = series[n];
  const gapNow = Math.abs(series[n] - twin[n]);
  const levels = useMemo(() => (cycle ? Array.from(settled.subarray(0, cycle)).sort((a, b) => a - b) : []), [cycle, settled]);
  const nearest = levels.length ? levels.reduce((b, v) => (Math.abs(v - xNow) < Math.abs(b - xNow) ? v : b), levels[0]) : null;

  const accent = palette.roles[0] ?? palette.ink;
  const curve = palette.roles[2] ?? palette.ink;
  const reset = () => {
    runner.reset();
    setShown(0);
  };
  const seriesBox: Box = { x0: -1, x1: MOST + 1, y0: -0.02, y1: 1.02 };
  const preset = PRESETS.find((p) => Number(p.id) === r)?.id ?? "";

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={CHAOS} />
      <div className="mt-4">
        <ChaosTabs />
      </div>
      <TaskPage
        title={system?.name ?? "The logistic map"}
        job="The logistic map is the simplest model of a population that grows when small and is held back when crowded: next year's number is r times this year's, times the room left. It is the standard first example of a plain rule producing chaos, and every later idea in this topic can be seen in it. One number between zero and one, and one rule: multiply it by r and by one minus itself, and that is the next number. The job is to apply the rule again and again and say where the number ends up. On the left, iteration as a picture: up to the curve, across to the diagonal, repeat. On the right, the same numbers in order."
        input={
          <div className="space-y-3">
            <Choices options={PRESETS} value={preset} onPick={(id) => { setR(Number(id)); reset(); }} />
            <Slider label="r" min={0.5} max={4} step={0.001} value={r} format={(v) => v.toFixed(3)} onChange={(v) => { setR(v); reset(); }} />
            <Slider label="Start x0" min={0.01} max={0.99} step={0.005} value={x0} format={(v) => v.toFixed(3)} onChange={(v) => { setX0(v); reset(); }} />
            <Slider label="Iterate" min={1} max={8} step={1} value={iterate} format={(v) => `f applied ${Math.round(v)}x`} onChange={(v) => { setIterate(Math.round(v)); reset(); }} />
            <p className="text-[11px] text-muted">
              Click on the left picture to choose the start. Iterate draws the rule composed with
              itself: a two-cycle of the rule is a fixed point of the rule applied twice, which is
              why doubling is mechanical. A second start, one millionth away, runs faintly beside
              the first on the right.
            </p>
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            what="steps"
            limit={MOST}
            onToggle={() => {
              if (!runner.running && n >= MOST) reset();
              runner.toggle();
            }}
            onStep={(many) => setShown((v) => Math.min(MOST, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="grid gap-2 lg:grid-cols-[1fr_1fr]">
            <div><div className="h-[min(440px,calc(100vh-22rem))] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={UNIT}
                equal
                deps={[r, x0, n, iterate, palette]}
                onPick={(x) => {
                  setX0(Math.max(0.01, Math.min(0.99, x)));
                  reset();
                }}
                draw={(pen) => {
                  ticks(pen);
                  pen.line([[0, 0], [1, 1]], "#3a4048", 1);
                  const pts: [number, number][] = [];
                  for (let i = 0; i <= 600; i++) pts.push([i / 600, composed(i / 600)]);
                  pen.line(pts, curve, 1.8);
                  // every rung so far, the newest brightest
                  rungs.forEach((g, i) => {
                    const age = (rungs.length - i) / Math.max(1, rungs.length);
                    pen.ctx.globalAlpha = 0.25 + 0.75 * (1 - age);
                    pen.line([[g.x0, g.y0], [g.x1, g.y1]], accent, i >= rungs.length - 2 ? 1.8 : 1);
                    pen.ctx.globalAlpha = 1;
                  });
                  pen.dot(x0, 0, 4, INK);
                  if (n > 0) pen.dot(series[n], series[n], 5, INK);
                  else pen.ring(x0, 0, 7, INK, 1.5);
                }}
              />
            </div><Caption>{iterate === 1 ? "The rule f(x) = r x (1 - x), and the diagonal" : `f applied ${iterate} times, and the diagonal`}. Up to the curve, across to the diagonal: one step</Caption></div>
            <div><div className="h-[min(440px,calc(100vh-22rem))] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={seriesBox}
                deps={[series, twin, n, levels, palette]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  for (const level of levels) pen.line([[0, level], [MOST, level]], "#2b3a4a", 1);
                  const a: [number, number][] = [];
                  const b: [number, number][] = [];
                  for (let i = 0; i <= n; i++) {
                    a.push([i, series[i]]);
                    b.push([i, twin[i]]);
                  }
                  pen.line(b, "#5b616b", 1);
                  pen.line(a, accent, 1.2);
                  for (let i = 0; i <= n; i++) pen.dot(i, series[i], 2, accent);
                  if (n > 0) pen.dot(n, series[n], 4.5, INK);
                }}
              />
            </div><Caption>The numbers in order. Faint: a second start one millionth away. {`Blue lines: the cycle it settles on, period ${cycle}`}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={n === 0 ? undefined : cycle && nearest !== null && Math.abs(nearest - xNow) < 1e-3 ? true : cycle === 0 && gapNow > 0.05 ? false : undefined}>
              {n === 0
                ? `Start at ${x0.toFixed(3)} with r = ${r.toFixed(3)}. Press run, or one step, and follow the number up to the curve and across to the diagonal.`
                : cycle === 1
                  ? `After ${n} steps the number is ${xNow.toFixed(4)}, ${Math.abs(xNow - fixed) < 1e-3 ? "sitting on" : "closing on"} the fixed point 1 - 1/r = ${fixed.toFixed(4)}, where the curve crosses the diagonal. The slope there is ${(2 - r).toFixed(2)}, inside one, so the steps shrink and it stays.`
                  : cycle > 1 && cycle <= 16
                    ? `After ${n} steps the number is ${xNow.toFixed(4)}. It ${nearest !== null && Math.abs(nearest - xNow) < 1e-3 ? "has settled" : "is settling"} into a cycle of ${cycle} values: ${levels.map((v) => v.toFixed(3)).join(", ")}. The fixed point is still there at ${fixed.toFixed(3)}, but the slope there is ${(2 - r).toFixed(2)}, past one, so the number is thrown off it.`
                    : `After ${n} steps the number is ${xNow.toFixed(4)} and it has settled on nothing. The second start, one millionth away, is now ${gapNow.toFixed(gapNow < 0.001 ? 6 : 3)} away${gapNow > 0.05 ? ": the two have parted completely, and no step of this rule was random" : ", and the gap is growing"}. The exponent is ${lambda.toFixed(3)}: positive, so neighbours separate.`}
            </Verdict>
            <Readout
              rows={[
                ["R", r.toFixed(4)],
                ["What it settles on", cycle ? `a cycle of period ${cycle}` : "Nothing periodic within 64"],
                ["Lyapunov exponent", lambda.toFixed(4)],
                ["Which means", lambda > 0.005 ? "Neighbours separate: chaos" : lambda < -0.005 ? "Neighbours converge: a stable cycle" : "Neither: a bifurcation point"],
                ["Fixed point 1 - 1/r", r > 1 ? fixed.toFixed(4) : "Not in range"],
                ["Slope there", r > 1 ? (2 - r).toFixed(4) : "-"],
                ["Stable while the slope is inside one", r > 1 ? (Math.abs(2 - r) < 1 ? "yes" : "No, so it has doubled") : "-"],
                ["Gap between the two starts now", n > 0 ? gapNow.toExponential(2) : TWIN.toExponential(0)],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              A stable fixed point pulls the steps in because the curve is shallower than the
              diagonal there. Steepen it past one and the point repels; a two-cycle takes over and
              is stable in turn, until it doubles. The next page turns r up slowly and records what
              the number settles on at every value.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`chaos-logistic-r${r.toFixed(3)}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
