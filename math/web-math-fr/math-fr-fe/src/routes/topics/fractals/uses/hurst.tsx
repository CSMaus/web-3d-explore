import { createFileRoute } from "@tanstack/react-router";
import { L } from "@/lib/lang";
import { Label, Button, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { INK, ONE, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/systems";
import { autocorrelation, fgn, graphDimension, horizonSpread, rescaledRange, shuffled, varianceScaling, walk } from "@/systems/scaling";

export const Route = createFileRoute("/topics/fractals/uses/hurst")({
  loader: () => api.system(TOPIC, "hurst"),
  component: HurstPage,
});

const N = 1024;
const BESIDE = [
  { id: "shuffled", label: L("Shown beside it: the same steps in shuffled order") },
  { id: "coin", label: L("Shown beside it: a coin-toss walk") },
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
  const cone = (from: number, at: number, h: number, colour: string, pen: import("@/components/Plot").Pen, dash: number[] = []) => {
    const up: [number, number][] = [];
    const down: [number, number][] = [];
    for (let t = 1; t <= horizon; t += Math.max(1, Math.round(horizon / 40))) {
      const w = horizonSpread(sd, h, t);
      up.push([at + t, from + w]);
      down.push([at + t, from - w]);
    }
    pen.ctx.setLineDash(dash);
    pen.line(up, colour, 1);
    pen.line(down, colour, 1);
    pen.ctx.setLineDash([]);
  };

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("Does a river remember its past years? The Hurst exponent")}
        job={L("Do the ups and downs of a river, a price or the traffic on a cable remember their past? Each of these can be drawn as a line that wanders up and down. In 1951 the engineer Harold Edwin Hurst found that the floods of the Nile do remember: wet years come in runs, and so do dry ones. One number, the Hurst exponent H, says how strong this memory is. In a walk built from coin tosses, each step goes up or down by chance, with no link to the steps before. For such a walk H is one half. Above one half, a run tends to go on. Below one half, a run tends to reverse. On this page a walk with a chosen H grows one step at a time. The page measures H from the steps alone and compares the walk with the same steps in random order. What to watch: the memory does not say where the line goes next, but it changes how wide the range of possible futures is.")}
        input={
          <div className="space-y-3">
            <Slider label={L("H chosen for the walk")} min={0.2} max={0.9} step={0.05} value={H} format={(v) => v.toFixed(2)} onChange={(v) => { setH(Math.round(v * 20) / 20); reset(); }} />
            <Choices options={BESIDE} value={beside} onPick={(id) => { setBeside(id); reset(); }} />
            <Slider label={L("How far ahead to look")} min={10} max={400} step={10} value={horizon} format={(v) => L("{{n}} steps ahead", { n: Math.round(v) })} onChange={(v) => setHorizon(Math.round(v))} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => { setSeed((s) => s + 1); reset(); }}>
                {L("Draw another walk")}
              </Button>
            </div>
            <Text kind="note" as="p">
              {L("The H slider sets the memory of the first walk. Its steps are drawn exactly from a model with memory, called fractional Gaussian noise, so the walk can grow one step at a time and still be a true sample of that model. The two choices set the second walk. Shuffling keeps every step but puts the steps in random order, and the order is where the memory lives. The coin-toss walk is a fresh walk with no memory. The last slider sets how many steps ahead the spread of the future is drawn.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            limit={N}
            what={L("steps")}
            onToggle={() => {
              if (!runner.running && n >= N) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        more={
          <section data-slot="panel">
            <Label>{L("WHERE IT IS USED")}</Label>
            <ul data-text="note" className="mt-2 space-y-2">
              <li>
                {L("Rivers and reservoirs. Hurst in 1951, across 690 records of the Nile, rainfall, tree rings and lake beds: the exponent came out near 0.72, not 0.5. A reservoir sized as if years were coin tosses runs dry in a long drought, because droughts come in clusters. Koutsoyiannis argued the same for flood risk in 2002: the usual statistics understate how long runs last.")}
              </li>
              <li>
                {L("Prices. Mandelbrot in 1963, on a century of cotton prices: big price moves are far more common than a bell curve allows, and the picture looks the same at every time scale. A bell curve is the usual model of chance, in which large departures from the average are extremely rare. Mandelbrot and Van Ness named the model with memory, fractional Brownian motion, in 1968. Today the memory is used for the size of price moves, not their direction. In 2004 Calvet and Fisher forecast volatility, how strongly prices swing, ten to fifty days ahead better than the standard models, with a model built on scaling: the same pattern at every time scale.")}
              </li>
              <li>
                {L("Cables. Leland, Taqqu, Willinger and Wilson in 1994: traffic on an Ethernet office network is self-similar, which means it looks the same at every time scale, with no natural size of burst. So adding more traffic together does not smooth it out, as the old telephone models assumed. Since Norros in 1995, the buffers that hold waiting data, and the capacity of lines, are sized with the kind of walk on this page.")}
              </li>
              <li>
                {L("What it cannot do. H says how risk grows with the time ahead and whether runs continue. It does not say what the next value will be: the correlation between one step and the next is small even at high H. A correlation is a number from -1 to 1 that says how much one value tends to follow another. And H is hard to read from a short series. In 1991 Lo showed that the memory claimed for stock returns can vanish once short-term effects are taken into account. The measured values below show this difficulty: they change as the walk grows.")}
              </li>
            </ul>
          </section>
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="grid gap-2 lg:grid-cols-2">
              <div>
                <div data-slot="plot" className="h-[240px] overflow-hidden">
                  <Plot
                    className="h-full w-full"
                    box={walkBox}
                    deps={[path, n, horizon, sd, Hm, walkBox]}
                    draw={(pen) => {
                      ticks(pen);
                      pen.line([[0, 0], [N + horizon, 0]], "#2c3540", 1);
                      const pts: [number, number][] = [];
                      for (let i = 0; i <= n; i++) pts.push([i, path[i]]);
                      pen.line(pts, ONE, 2);
                      if (n > 1) {
                        cone(path[n], n, 0.5, "#4a5560", pen, [5, 4]);
                        cone(path[n], n, Hm, ONE, pen);
                        pen.dot(n, path[n], 3.5, INK);
                      }
                    }}
                  />
                </div>
                <Caption>{L("The walk with memory, with H set to {{h}}: steps along the bottom, position up the side. The thicker line is the walk so far. Two pairs of lines open out from its last point and show how far the walk could go over the next {{horizon}} steps. The solid pair uses the H measured so far. The dashed pair uses the coin-toss rule, which grows with the square root of the number of steps. The pairs show how wide the future is, not where the walk will go.", { h: H.toFixed(2), horizon })}</Caption>
              </div>
              <div>
                <div data-slot="plot" className="h-[240px] overflow-hidden">
                  <Plot
                    className="h-full w-full"
                    box={walkBox}
                    deps={[pathOther, n, horizon, sd, fitOther, walkBox]}
                    draw={(pen) => {
                      ticks(pen);
                      pen.line([[0, 0], [N + horizon, 0]], "#2c3540", 1);
                      const pts: [number, number][] = [];
                      for (let i = 0; i <= n; i++) pts.push([i, pathOther[i]]);
                      pen.line(pts, TWO, 2);
                      if (n > 1) {
                        cone(pathOther[n], n, fitOther?.slope ?? 0.5, TWO, pen);
                        pen.dot(n, pathOther[n], 3.5, INK);
                      }
                    }}
                  />
                </div>
                <Caption>{beside === "shuffled" ? L("The same steps as the first walk, put in random order and added up. Every step has the same size as before. Only the order has changed, and with it the runs are gone. The pair of lines ahead shows the spread of its future.") : L("A coin-toss walk with no memory (H one half), drawn for comparison from different random steps of the same size. The pair of lines ahead shows the spread of its future.")}</Caption>
              </div>
            </div>
            <div>
              <div data-slot="plot" className="h-[220px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={logBox}
                  deps={[fit, fitOther, rs]}
                  draw={(pen) => {
                    ticks(pen, { x: 0.5, y: 1, xFormat: (v) => Math.round(Math.pow(10, v)).toString(), yFormat: (v) => `1e${v.toFixed(0)}` });
                    if (!fit || !fitOther) return;
                    const lineOf = (f: typeof fit, colour: string, weight: number) => {
                      const xs = f.sizes.map(Math.log10);
                      const ys = f.values.map(Math.log10);
                      for (let i = 0; i < xs.length; i++) pen.dot(xs[i], ys[i], 2.5, colour);
                      const x0 = xs[0];
                      const x1 = xs[xs.length - 1];
                      const y0 = (f.intercept + 2 * f.slope * Math.log(f.sizes[0])) / Math.LN10;
                      const y1 = (f.intercept + 2 * f.slope * Math.log(f.sizes[f.sizes.length - 1])) / Math.LN10;
                      pen.line([[x0, y0], [x1, y1]], colour, weight);
                    };
                    lineOf(fit, ONE, 2.2);
                    lineOf(fitOther, TWO, 1);
                    // the coin's slope, for the eye
                    const c0 = Math.log10(fit.values[0]);
                    pen.ctx.setLineDash([5, 4]);
                    pen.line([[Math.log10(fit.sizes[0]), c0], [logBox.x1 - 0.1, c0 + (logBox.x1 - 0.1 - Math.log10(fit.sizes[0]))]], "#4a5560", 1);
                    pen.ctx.setLineDash([]);
                  }}
                />
              </div>
              <Caption>{L("This chart measures H. Both axes are logarithmic: each step along an axis multiplies the value by the same factor. Along the bottom: the length of a block of consecutive steps. Up the side: how much the sums of such blocks vary. The points lie close to a straight line whose slope is twice H. Dots with the thicker line: the walk with memory, slope {{a}}. Dots with the thinner line: the second walk, slope {{b}}. Dashed line: slope one, the coin toss.", { a: fit ? (2 * fit.slope).toFixed(2) : "-", b: fitOther ? (2 * fitOther.slope).toFixed(2) : "-" })}</Caption>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {n === 0
                ? L("H is set to {{h}}: {{what}}. Press run and the walk grows one step at a time, and H is measured from the steps as they arrive.", { h: H.toFixed(2), what: H > 0.55 ? L("runs tend to continue") : H < 0.45 ? L("runs tend to reverse") : L("a coin toss, no memory") })
                : !fit
                  ? L("{{n}} steps so far. The measurement needs at least 64 steps.", { n })
                  : `${L("After {{n}} steps, the H measured from the steps is {{m}}, against {{h}} set: {{kind}}.", { n, m: fit.slope.toFixed(2), h: H.toFixed(2), kind: fit.slope > 0.58 ? L("persistent: a run tends to go on") : fit.slope < 0.42 ? L("anti-persistent: a run tends to reverse") : L("close to a coin toss") })} ${beside === "shuffled" ? L("The same steps in shuffled order measure {{m}}: the memory was in the order of the steps, and nowhere else.", { m: String(fitOther?.slope.toFixed(2)) }) : L("The coin-toss walk measures {{m}}.", { m: String(fitOther?.slope.toFixed(2)) })} ${L("{{horizon}} steps ahead, the spread of possible positions is {{a}}, against {{b}} for a coin toss: {{ratio}} times {{dir}}. The next single step is barely easier to predict: its correlation with the step before is {{lag}}.", { horizon, a: horizonSpread(sd, fit.slope, horizon).toFixed(1), b: horizonSpread(sd, 0.5, horizon).toFixed(1), ratio: (Math.pow(horizon, fit.slope - 0.5)).toFixed(2), dir: fit.slope > 0.5 ? L("wider") : L("narrower"), lag: lag1.toFixed(2) })}`}
            </Verdict>
            <Readout
              rows={[
                [L("H chosen for the walk"), H.toFixed(2)],
                [L("H measured from how block sums vary"), fit ? fit.slope.toFixed(3) : "-"],
                [L("H measured by Hurst's own method (rescaled range)"), rs ? L("{{v}}, a second estimate. On a short series the two estimates disagree, which is the difficulty Lo pointed out", { v: rs.slope.toFixed(3) }) : "-"],
                [L("H measured for the second walk"), fitOther ? fitOther.slope.toFixed(3) : "-"],
                [L("Correlation of one step with the next"), n >= 10 ? L("{{m}} measured, {{e}} exact", { m: lag1.toFixed(3), e: autocorrelation(H, 1).toFixed(3) }) : "-"],
                [L("Roughness of the line (box-counting dimension)"), dim ? L("{{m}} measured, 2 - H = {{e}}", { m: dim.slope.toFixed(2), e: (2 - H).toFixed(2) }) : L("needs 128 steps")],
                [L("Typical size of one step"), sd.toFixed(3)],
                [L("Spread of possible positions {{horizon}} steps ahead", { horizon }), fit ? L("{{a}}; for a coin toss {{b}}", { a: horizonSpread(sd, fit.slope, horizon).toFixed(2), b: horizonSpread(sd, 0.5, horizon).toFixed(2) }) : "-"],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("Why this page belongs to the topic on fractals. A fractal is a shape that stays rough however closely it is looked at, like a coastline. Its roughness is measured by a number called its dimension: 1 for a smooth line, more for a rougher one. The line of this walk is a fractal of dimension two minus H. The walk whose runs go on draws the smoother line. The walk whose runs reverse draws the rougher one. It is measured the same way as a coastline, by box counting: the line is covered with small squares, and the squares it touches are counted as they shrink. In both cases the measure follows a power of the scale, the exponent is read from a slope, and the roughness does not go away on a closer look.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="fractals-hurst" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
