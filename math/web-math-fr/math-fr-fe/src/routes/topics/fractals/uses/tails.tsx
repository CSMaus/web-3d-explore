import { createFileRoute } from "@tanstack/react-router";
import { L } from "@/lib/lang";
import { Label, Button, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/systems";
import { pareto, paretoMean, survival, tailIndex, thin } from "@/systems/actuary";
import { rngFrom } from "@/systems/scaling";

export const Route = createFileRoute("/topics/fractals/uses/tails")({
  loader: () => api.system(TOPIC, "tails"),
  component: TailsPage,
});

const N = 2000;
const FLOOR = 1;

function TailsPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [alpha, setAlpha] = useState(1.5);
  const [seed, setSeed] = useState(9);
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(6);

  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: N });
  const n = Math.min(shown, N);
  const typical = paretoMean(Math.max(alpha, 1.1), FLOOR);
  const heavy = useMemo(() => {
    const r = rngFrom(seed);
    return Array.from({ length: N }, () => pareto(alpha, FLOOR, r));
  }, [alpha, seed]);
  const light = useMemo(() => {
    const r = rngFrom(seed + 100);
    return Array.from({ length: N }, () => thin(typical, r));
  }, [typical, seed]);
  const running = (xs: number[]) => {
    const out: [number, number][] = [];
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += xs[i];
      out.push([i + 1, sum / (i + 1)]);
    }
    return out;
  };
  const meanHeavy = useMemo(() => running(heavy), [heavy, n]); // eslint-disable-line react-hooks/exhaustive-deps
  const meanLight = useMemo(() => running(light), [light, n]); // eslint-disable-line react-hooks/exhaustive-deps
  const seen = useMemo(() => heavy.slice(0, n), [heavy, n]);
  const seenLight = useMemo(() => light.slice(0, n), [light, n]);
  const surv = useMemo(() => (n >= 50 ? survival(seen) : []), [seen, n]);
  const survLight = useMemo(() => (n >= 50 ? survival(seenLight) : []), [seenLight, n]);
  // the top tenth of the claims, each divided by the smallest of them: the same picture again
  const topTenth = useMemo(() => {
    if (n < 100) return [] as [number, number][];
    const sorted = [...seen].sort((a, b) => b - a).slice(0, Math.floor(n / 10));
    const floor = sorted[sorted.length - 1];
    return survival(sorted.map((v) => v / floor));
  }, [seen, n]);
  const measured = useMemo(() => tailIndex(surv), [surv]);
  const largest = seen.length ? Math.max(...seen) : 0;
  const total = seen.reduce((a, b) => a + b, 0);
  const share = total ? largest / total : 0;
  const meanTop = Math.max(typical * 2.5, ...meanHeavy.slice(Math.floor(meanHeavy.length / 10)).map((p) => p[1]), 1);
  const meanBox: Box = { x0: 0, x1: N, y0: 0, y1: meanTop };
  const logBox: Box = { x0: 0, x1: Math.max(1, Math.log10(largest || 10) + 0.2), y0: -3.4, y1: 0.2 };
  const reset = () => {
    runner.reset();
    setShown(0);
  };

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("When one claim outweighs a thousand")}
        job={L("Can one insurance claim cost more than a thousand ordinary ones together? It can. A claim is a request for payment after a loss. Most claims are small, a few are enormous, and the enormous ones are not rare enough to ignore: a fire, a storm or a court case can cost more than the previous thousand claims put together. Pareto found the same pattern in incomes in 1896, and Mandelbrot in cotton prices in 1963. Such a spread of sizes is said to have a heavy tail; the tail means the largest values. It is a fractal, a shape that looks alike at every scale, in the same way as a coastline: the largest tenth of the claims, rescaled, is spread exactly like all the claims. One number, the tail index alpha, says how fast the tail thins out. On this page claims arrive one at a time from a heavy tail, beside claims from an ordinary spread with the same typical size. The question: which running average settles down, and which never does?")}
        input={
          <div className="space-y-3">
            <Slider label={L("Tail index alpha")} min={1.1} max={3.5} step={0.05} value={alpha} format={(v) => v.toFixed(2)} onChange={(v) => { setAlpha(Math.round(v * 20) / 20); reset(); }} />
            <Button variant="outline" size="sm" type="button" onClick={() => { setSeed((s) => s + 1); reset(); }}>
              {L("Draw new claims")}
            </Button>
            <Text kind="note" as="p">
              {L("The slider sets alpha, the tail index of the heavy-tailed claims: the smaller it is, the more often huge claims come. Sizes are measured in units of the smallest possible claim. The comparison claims come from a thin tail, a lognormal spread, in which huge claims are extremely rare. Its average is set equal to the theoretical average of the heavy tail. So any difference in how the two averages behave comes from the tail and nothing else. Variance measures how far claims stray from their average. When alpha is below two, the variance of the heavy tail is infinite. When alpha is below one, even its average is infinite.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            limit={N}
            what={L("claims")}
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
                {L("Danish fire insurance, 1980 to 1990: 2,156 losses above a million kroner. McNeil fitted them in 1997 with the tail law used on this page. The textbook of the method is by Embrechts, Kluppelberg and Mikosch, 1997. An insurer prices the top of the tail separately and often passes it in layers to a reinsurer, a company that insures insurers, because the ordinary average says nothing about it.")}
              </li>
              <li>
                {L("Mandelbrot named two effects after two stories from the Bible. The Noah effect, after the flood: a single event so large that it dominates everything; this is the heavy tail on this page. The Joseph effect, after the seven fat years and seven lean years: long runs of good or bad years. A page on the same topic, 'Forecasting', measures that memory in a wandering line. Both effects break the statistics built on the bell curve and on coin tosses, and both are laws of scale with one exponent.")}
              </li>
              <li>
                {L("The link to a coastline. Measure a coastline with a ruler: the shorter the ruler, the more ruler lengths it takes, and Richardson found that the count grows as a power of how short the ruler is. For a Pareto tail, the count of claims above a size shrinks as a power of that size. In both cases the exponent is read from the slope of a log-log chart, a chart on which both axes are logarithmic, and in both the picture is the same at every scale. The tail index plays the part for a spread of sizes that the dimension plays for a coastline.")}
              </li>
              <li>
                {L("How this fits with pricing a single customer. A customer's expected yearly cost of claims is how often the customer claims times how big a claim is. How often can be learnt from the customer's own record, year by year; a page on the same topic, 'Pricing a new customer', shows how. The tail of claim sizes cannot be learnt from one customer at all. It is estimated on all of an insurer's customers together, with the extreme value theory of Embrechts and colleagues.")}
              </li>
            </ul>
          </section>
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div>
              <div data-slot="plot" className="h-[230px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={meanBox}
                  deps={[meanHeavy, meanLight, typical, meanBox]}
                  draw={(pen) => {
                    ticks(pen);
                    pen.ctx.setLineDash([5, 4]);
                    if (Number.isFinite(typical)) pen.line([[0, typical], [N, typical]], "#4a5560", 1);
                    pen.ctx.setLineDash([]);
                    pen.line(meanLight, SKY, 1);
                    pen.line(meanHeavy, TWO, 2.2);
                    // the claims themselves as faint ticks where they exceed the frame
                    for (let i = 0; i < n; i++) if (heavy[i] > meanTop) pen.line([[i + 1, meanTop * 0.94], [i + 1, meanTop]], TWO, 1);
                    if (meanHeavy.length) pen.dot(n, meanHeavy[meanHeavy.length - 1][1], 3.5, INK);
                  }}
                />
              </div>
              <Caption>{L("The running average: the average of all claims so far, with the number of claims along the bottom. Thicker line: heavy-tailed claims, alpha {{alpha}}. Thinner line: thin-tailed claims with the same average. Dashed horizontal line: the theoretical average of the heavy tail{{mean}}. Short marks along the top edge: claims too large to fit in the frame.", { alpha: alpha.toFixed(2), mean: Number.isFinite(typical) ? `, ${typical.toFixed(2)}` : L(", which does not exist below alpha of one") })}</Caption>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              <div>
                <div data-slot="plot" className="h-[220px] overflow-hidden">
                  <Plot
                    className="h-full w-full"
                    box={logBox}
                    deps={[surv, survLight, topTenth, alpha, logBox]}
                    draw={(pen) => {
                      ticks(pen, { x: 0.5, y: 1, xFormat: (v) => `${Math.round(Math.pow(10, v))}`, yFormat: (v) => `1e${v.toFixed(0)}` });
                      const toLog = (c: [number, number][]) => c.filter((p) => p[1] > 0 && p[0] > 0).map(([x, y]) => [Math.log10(x), Math.log10(y)] as [number, number]);
                      pen.line(toLog(survLight), SKY, 1);
                      pen.line(toLog(surv), TWO, 2.6);
                      pen.ctx.setLineDash([8, 5]);
                      pen.line(toLog(topTenth), ONE, 1.4);
                      pen.ctx.setLineDash([2, 3]);
                      // the exact law, a straight line of slope minus alpha
                      pen.line([[0, 0], [logBox.x1, -alpha * logBox.x1]], "#4a5560", 1);
                      pen.ctx.setLineDash([]);
                    }}
                  />
                </div>
                <Caption>{L("Both axes are logarithmic: each step along an axis multiplies the value by ten. Along the bottom: a claim size. Up the side: the fraction of claims at least that large. Thickest line: heavy-tailed claims, a straight line with slope about minus {{alpha}}. Thin solid line that bends down: thin-tailed claims. Long dashes: the largest tenth of the heavy-tailed claims alone, each divided by the smallest of them; it falls on the same straight line. Short dashes: the exact law.", { alpha: alpha.toFixed(2) })}</Caption>
              </div>
              <div>
                <div data-slot="plot" className="h-[220px] overflow-hidden">
                  <Plot
                    className="h-full w-full"
                    box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                    deps={[seen, seenLight, largest]}
                    draw={(pen) => {
                      const { ctx } = pen;
                      // every claim as a bar, in order, heavy above and thin below, both on the heavy scale
                      const scale = Math.max(largest, typical * 3, 1);
                      const w = pen.width / Math.max(1, n);
                      for (let i = 0; i < n; i++) {
                        const hh = (heavy[i] / scale) * pen.height * 0.46;
                        ctx.fillStyle = TWO;
                        ctx.fillRect(i * w, pen.height * 0.48 - hh, Math.max(1, w), hh);
                        const hl = (light[i] / scale) * pen.height * 0.46;
                        ctx.fillStyle = SKY;
                        ctx.fillRect(i * w, pen.height - hl, Math.max(1, w), hl);
                      }
                      ctx.fillStyle = "#2c3540";
                      ctx.fillRect(0, pen.height * 0.5, pen.width, 1);
                      pen.text(L("largest claim {{v}}", { v: largest.toFixed(1) }), pen.width - 6, 12, MUTED, "right");
                    }}
                  />
                </div>
                <Caption>{L("Every claim as a bar, in the order it arrived, both rows on the same scale. Top row: heavy-tailed claims. Bottom row: thin-tailed claims. The top row is mostly tiny bars, with a few huge ones that set the scale for everything.")}</Caption>
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={n < 50 ? undefined : alpha < 2 ? false : true}>
              {n === 0
                ? L("Alpha is {{alpha}}: {{what}}. Press run and the claims arrive one at a time.", { alpha: alpha.toFixed(2), what: alpha <= 1 ? L("the average itself is infinite") : alpha < 2 ? L("the average is finite but the variance is infinite") : L("both the average and the variance are finite") })
                : n < 50
                  ? L("{{n}} claims so far. Reading the tail needs fifty.", { n })
                  : `${L("After {{n}} claims the running average of the heavy-tailed claims is {{heavy}} and of the thin-tailed claims {{thin}}{{aim}}.", { n, heavy: meanHeavy[n - 1][1].toFixed(2), thin: meanLight[n - 1][1].toFixed(2), aim: Number.isFinite(typical) ? L(", both heading for {{v}}", { v: typical.toFixed(2) }) : "" })} ${L("The largest heavy-tailed claim so far is {{largest}}, {{share}} per cent of everything paid out{{noah}}.", { largest: largest.toFixed(1), share: (share * 100).toFixed(0), noah: share > 0.1 ? L(": one claim outweighs hundreds, which Mandelbrot called the Noah effect") : "" })} ${L("The tail index read from the slope is {{m}}, against {{alpha}} set{{tail}}", { m: Number.isFinite(measured) ? measured.toFixed(2) : "-", alpha: alpha.toFixed(2), tail: alpha < 2 ? L(", below two: the variance is infinite and the average will never settle, however many claims come. The thin-tailed average settled long ago.") : L(", above two: the average settles, but more slowly than the thin-tailed one.") })} ${L("The largest tenth of the claims, rescaled, lies on the same line as all of them: the tail looks the same at every scale.")}`}
            </Verdict>
            <Readout
              rows={[
                [L("Tail index alpha, as set"), alpha.toFixed(2)],
                [L("Tail index, read from the slope of the chart"), Number.isFinite(measured) ? measured.toFixed(3) : "-"],
                [L("Theoretical average of the heavy tail"), Number.isFinite(typical) ? typical.toFixed(3) : L("infinite")],
                [L("Theoretical variance of the heavy tail"), alpha > 2 ? ((alpha * FLOOR * FLOOR) / ((alpha - 1) * (alpha - 1) * (alpha - 2))).toFixed(3) : L("infinite")],
                [L("Average of heavy-tailed claims so far"), n ? meanHeavy[n - 1][1].toFixed(3) : "-"],
                [L("Average of thin-tailed claims so far"), n ? meanLight[n - 1][1].toFixed(3) : "-"],
                [L("Largest claim, and its share of the total"), n ? L("{{v}}, {{share}} per cent", { v: largest.toFixed(2), share: (share * 100).toFixed(1) }) : "-"],
                [L("Claims larger than ten times the smallest possible"), n ? L("{{count}}; the tail law predicts {{law}}", { count: seen.filter((v) => v > 10 * FLOOR).length, law: (n * Math.pow(0.1, alpha)).toFixed(1) }) : "-"],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("The straight line on the log-log chart sums it up: a power law, an exponent, and a picture that looks the same at every scale. Richardson found it for the coastline, Pareto for incomes, Mandelbrot for prices and floods. An actuary, the person who works out insurance prices, does not average such a tail away. The tail is priced on its own, with the exponent measured on all of an insurer's business, not on any one customer.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="fractals-tails" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
