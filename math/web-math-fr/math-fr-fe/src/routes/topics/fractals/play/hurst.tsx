import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { PlayTabs } from "@/components/PlayTabs";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { INK, ONE, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/systems";
import { FRACTALS } from "@/lib/topic";
import { autocorrelation, fgn, graphDimension, horizonSpread, rescaledRange, shuffled, varianceScaling, walk } from "@/systems/scaling";

export const Route = createFileRoute("/topics/fractals/play/hurst")({
  loader: () => api.system(TOPIC, "hurst"),
  component: HurstPage,
});

const N = 1024;
const BESIDE = [
  { id: "shuffled", label: "Beside it: the same steps shuffled" },
  { id: "coin", label: "Beside it: a coin-toss walk" },
];

function HurstPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [H, setH] = useState(0.7);
  const [seed, setSeed] = useState(3);
  const [beside, setBeside] = useState("shuffled");
  const [horizon, setHorizon] = useState(100);
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(4);

  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: N });
  const n = Math.min(shown, N);
  const steps = useMemo(() => fgn(H, N, seed), [H, seed]);
  const other = useMemo(() => (beside === "shuffled" ? shuffled(steps, seed + 11) : fgn(0.5, N, seed + 23)), [beside, steps, seed]);
  const path = useMemo(() => walk(steps), [steps]);
  const pathOther = useMemo(() => walk(other), [other]);
  const seen = useMemo(() => steps.subarray(0, n), [steps, n]);
  const seenOther = useMemo(() => other.subarray(0, n), [other, n]);
  const enough = n >= 64;
  const fit = useMemo(() => (enough ? varianceScaling(seen) : null), [seen, enough]);
  const fitOther = useMemo(() => (enough ? varianceScaling(seenOther) : null), [seenOther, enough]);
  const rs = useMemo(() => (enough ? rescaledRange(seen) : null), [seen, enough]);
  const dim = useMemo(() => (n >= 128 ? graphDimension(path.subarray(0, n + 1)) : null), [path, n]);
  const sd = useMemo(() => {
    if (n < 2) return 1;
    let m = 0;
    for (let i = 0; i < n; i++) m += seen[i];
    m /= n;
    let v = 0;
    for (let i = 0; i < n; i++) v += (seen[i] - m) * (seen[i] - m);
    return Math.sqrt(v / n);
  }, [seen, n]);
  const lag1 = useMemo(() => {
    if (n < 10) return 0;
    let m = 0;
    for (let i = 0; i < n; i++) m += seen[i];
    m /= n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      den += (seen[i] - m) * (seen[i] - m);
      if (i) num += (seen[i] - m) * (seen[i - 1] - m);
    }
    return den ? num / den : 0;
  }, [seen, n]);
  const Hm = fit?.slope ?? H;
  const walkBox = useMemo<Box>(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of [path, pathOther]) for (let i = 0; i <= N; i++) {
      if (p[i] < lo) lo = p[i];
      if (p[i] > hi) hi = p[i];
    }
    const pad = (hi - lo) * 0.1 || 1;
    return { x0: 0, x1: N + horizon, y0: lo - pad, y1: hi + pad };
  }, [path, pathOther, horizon]);
  const logBox: Box = { x0: 0, x1: Math.log10(N / 8) + 0.1, y0: -0.5, y1: Math.log10(N / 8) * 2 * 0.95 + 0.6 };
  const reset = () => {
    runner.reset();
    setShown(0);
  };
  const cone = (from: number, at: number, h: number, colour: string, pen: import("@/components/Plot").Pen) => {
    const up: [number, number][] = [];
    const down: [number, number][] = [];
    for (let t = 1; t <= horizon; t += Math.max(1, Math.round(horizon / 40))) {
      const w = horizonSpread(sd, h, t);
      up.push([at + t, from + w]);
      down.push([at + t, from - w]);
    }
    pen.line(up, colour, 1);
    pen.line(down, colour, 1);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={FRACTALS} />
      <div className="mt-4">
        <PlayTabs />
      </div>
      <TaskPage
        title={system?.name ?? "A line that remembers: the Hurst exponent"}
        job="A price, a river level, the traffic on a cable: each is a line that wanders, and the question is whether its steps remember the steps before them. In 1951 Hurst found that the Nile's floods do: wet years come in runs. One number, H, says how much. A coin-toss walk has H of one half; above it a run tends to go on, below it to reverse. The job is to grow such a walk one step at a time, measure H from the steps alone, compare it with the same steps in a random order, and see what the memory buys a forecast: not the next value, but how wide the future is."
        input={
          <div className="space-y-3">
            <Slider label="H set" min={0.2} max={0.9} step={0.05} value={H} format={(v) => v.toFixed(2)} onChange={(v) => { setH(Math.round(v * 20) / 20); reset(); }} />
            <Choices options={BESIDE} value={beside} onPick={(id) => { setBeside(id); reset(); }} />
            <Slider label="Horizon" min={10} max={400} step={10} value={horizon} format={(v) => `${Math.round(v)} steps ahead`} onChange={(v) => setHorizon(Math.round(v))} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setSeed((s) => s + 1); reset(); }} className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-leaf">
                Draw another sample
              </button>
            </div>
            <p className="text-[11px] text-muted">
              The steps are drawn exactly from the model with memory, fractional Gaussian noise, so
              a run can grow one step at a time and still be a true sample. Shuffling the same steps
              keeps every step and destroys the order, which is where the memory lives.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            limit={N}
            what="steps"
            onToggle={() => {
              if (!runner.running && n >= N) reset();
              runner.toggle();
            }}
            onStep={(many) => setShown((v) => Math.min(N, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        more={
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">WHERE IT IS USED</h2>
            <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-muted">
              <li>
                Rivers and reservoirs. Hurst, 1951: across 690 records of the Nile, rainfall, tree
                rings and lake beds the exponent came out near 0.72, not 0.5. A reservoir sized by the
                coin-toss rule runs dry in a long drought, because droughts cluster. Koutsoyiannis in
                2002 argued the same for flood risk: the classical statistics understate the long run.
              </li>
              <li>
                Prices. Mandelbrot, 1963, on a century of cotton prices: the big moves are far more
                common than a bell curve allows and the picture looks the same at every time scale.
                Mandelbrot and Van Ness gave the model its name in 1968. Today the memory is used for
                the size of moves rather than their direction: Calvet and Fisher in 2004 forecast
                volatility ten to fifty days out better than the standard models with a model built
                on scaling.
              </li>
              <li>
                Cables. Leland, Taqqu, Willinger and Wilson, 1994: traffic on an Ethernet is
                self-similar, with no natural burst size, so adding more traffic does not smooth it
                out as the old telephone models assumed. Buffers and capacity are now sized with the
                walk on this page, after Norros, 1995.
              </li>
              <li>
                What it cannot do. H says how risk grows with the horizon and whether runs continue.
                It does not say what the next value is: the correlation between one step and the next
                is small even at high H. And H is hard to read off a short series: Lo showed in 1991
                that the memory claimed in stock returns can vanish once short-range effects are
                allowed for. The measured value below is honest about that: it moves as the run grows.
              </li>
            </ul>
          </section>
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="grid gap-2 lg:grid-cols-2">
              <div>
                <div className="h-[240px] overflow-hidden rounded border border-edge">
                  <Plot
                    className="h-full w-full"
                    box={walkBox}
                    deps={[path, n, horizon, sd, Hm, walkBox]}
                    draw={(pen) => {
                      ticks(pen);
                      pen.line([[0, 0], [N + horizon, 0]], "#2c3540", 1);
                      const pts: [number, number][] = [];
                      for (let i = 0; i <= n; i++) pts.push([i, path[i]]);
                      pen.line(pts, ONE, 1.2);
                      if (n > 1) {
                        cone(path[n], n, 0.5, "#4a5560", pen);
                        cone(path[n], n, Hm, ONE, pen);
                        pen.dot(n, path[n], 3.5, INK);
                      }
                    }}
                  />
                </div>
                <Caption>{`The walk with memory, H set to ${H.toFixed(2)}. Ahead of the last point: the spread the future could take over the next ${horizon} steps. Green: from the H measured so far. Grey: a coin's square-root rule. Beyond the run, not a forecast of where, only of how wide.`}</Caption>
              </div>
              <div>
                <div className="h-[240px] overflow-hidden rounded border border-edge">
                  <Plot
                    className="h-full w-full"
                    box={walkBox}
                    deps={[pathOther, n, horizon, sd, fitOther, walkBox]}
                    draw={(pen) => {
                      ticks(pen);
                      pen.line([[0, 0], [N + horizon, 0]], "#2c3540", 1);
                      const pts: [number, number][] = [];
                      for (let i = 0; i <= n; i++) pts.push([i, pathOther[i]]);
                      pen.line(pts, TWO, 1.2);
                      if (n > 1) {
                        cone(pathOther[n], n, fitOther?.slope ?? 0.5, TWO, pen);
                        pen.dot(n, pathOther[n], 3.5, INK);
                      }
                    }}
                  />
                </div>
                <Caption>{beside === "shuffled" ? "The same steps in a random order, added up. Every step is the same size as on the left; only the order has gone, and with it the runs." : "A coin-toss walk, H one half, for comparison, from a different draw of the same size."}</Caption>
              </div>
            </div>
            <div>
              <div className="h-[220px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={logBox}
                  deps={[fit, fitOther, rs]}
                  draw={(pen) => {
                    ticks(pen, { x: 0.5, y: 1, xFormat: (v) => Math.round(Math.pow(10, v)).toString(), yFormat: (v) => `1e${v.toFixed(0)}` });
                    if (!fit || !fitOther) return;
                    const lineOf = (f: typeof fit, colour: string) => {
                      const xs = f.sizes.map(Math.log10);
                      const ys = f.values.map(Math.log10);
                      for (let i = 0; i < xs.length; i++) pen.dot(xs[i], ys[i], 2.5, colour);
                      const x0 = xs[0];
                      const x1 = xs[xs.length - 1];
                      const y0 = (f.intercept + 2 * f.slope * Math.log(f.sizes[0])) / Math.LN10;
                      const y1 = (f.intercept + 2 * f.slope * Math.log(f.sizes[f.sizes.length - 1])) / Math.LN10;
                      pen.line([[x0, y0], [x1, y1]], colour, 1);
                    };
                    lineOf(fit, ONE);
                    lineOf(fitOther, TWO);
                    // the coin's slope, for the eye
                    const c0 = Math.log10(fit.values[0]);
                    pen.line([[Math.log10(fit.sizes[0]), c0], [logBox.x1 - 0.1, c0 + (logBox.x1 - 0.1 - Math.log10(fit.sizes[0]))]], "#4a5560", 1);
                  }}
                />
              </div>
              <Caption>{`Both axes logarithmic. Along the bottom: the size of a block of steps. Up: how much the block sums vary. The slope is twice H. Green: this walk, slope ${fit ? (2 * fit.slope).toFixed(2) : "-"}. Rose: the comparison, slope ${fitOther ? (2 * fitOther.slope).toFixed(2) : "-"}. Grey: the coin's slope of one.`}</Caption>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {n === 0
                ? `H is set to ${H.toFixed(2)}: ${H > 0.55 ? "runs tend to continue" : H < 0.45 ? "runs tend to reverse" : "a coin toss, no memory"}. Press run and the walk grows one step at a time, with H measured from the steps as they come.`
                : !fit
                  ? `${n} steps so far. The measurement needs 64 steps to say anything.`
                  : `After ${n} steps the exponent measured from the steps is ${fit.slope.toFixed(2)} against ${H.toFixed(2)} set: ${fit.slope > 0.58 ? "persistent, a run tends to go on" : fit.slope < 0.42 ? "anti-persistent, a run tends to reverse" : "close to a coin"}. ${beside === "shuffled" ? `The same steps shuffled measure ${fitOther?.slope.toFixed(2)}: the memory was in the order, and nothing else.` : `The coin-toss walk measures ${fitOther?.slope.toFixed(2)}.`} ${horizon} steps ahead the spread is ${horizonSpread(sd, fit.slope, horizon).toFixed(1)} against ${horizonSpread(sd, 0.5, horizon).toFixed(1)} for a coin, ${(Math.pow(horizon, fit.slope - 0.5)).toFixed(2)} times ${fit.slope > 0.5 ? "wider" : "narrower"}. The next step on its own is barely more predictable: its correlation with the last is ${lag1.toFixed(2)}.`}
            </Verdict>
            <Readout
              rows={[
                ["H set", H.toFixed(2)],
                ["H measured, block variances", fit ? fit.slope.toFixed(3) : "-"],
                ["H measured, Hurst's rescaled range", rs ? `${rs.slope.toFixed(3)}, a second reading; the two disagree on a short series, which is the difficulty Lo pointed at` : "-"],
                ["The comparison's H", fitOther ? fitOther.slope.toFixed(3) : "-"],
                ["Correlation of one step with the next", n >= 10 ? `${lag1.toFixed(3)} measured, ${autocorrelation(H, 1).toFixed(3)} exact` : "-"],
                ["Dimension of the graph, box counting", dim ? `${dim.slope.toFixed(2)} measured, 2 - H = ${(2 - H).toFixed(2)}` : "needs 128 steps"],
                ["Spread of one step", sd.toFixed(3)],
                [`Spread ${horizon} steps ahead`, fit ? `${horizonSpread(sd, fit.slope, horizon).toFixed(2)}, a coin ${horizonSpread(sd, 0.5, horizon).toFixed(2)}` : "-"],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              The graph of this walk is a fractal curve of dimension two minus H: the persistent walk
              is the smoother line, the anti-persistent one the rougher, and the same box count that
              measured the coastline measures it. That is the whole link between this page and the
              rest of the topic: a scaling law, an exponent read off a slope, and roughness that does
              not go away on looking closer.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="fractals-hurst" />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
