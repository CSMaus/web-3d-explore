import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
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
import { INK, MUTED, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/systems";
import { FRACTALS } from "@/lib/topic";
import { pareto, paretoMean, survival, tailIndex, thin } from "@/systems/actuary";
import { rngFrom } from "@/systems/scaling";

export const Route = createFileRoute("/topics/fractals/play/tails")({
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
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={FRACTALS} />
      <div className="mt-4">
        <PlayTabs />
      </div>
      <TaskPage
        title={system?.name ?? "Claims with a fractal tail"}
        job="Most claims are small and a few are enormous, and the enormous ones are not rare enough to ignore: a fire, a storm, a liability case can cost more than the previous thousand claims together. Pareto found the same shape in incomes in 1896, and Mandelbrot in 1963 in cotton prices. It is a fractal in the same sense as the coastline: the largest tenth of the claims, rescaled, is distributed exactly like the whole, at every scale, with one exponent saying how fast the tail thins. The job is to let claims arrive one at a time beside a bell-shaped comparison of the same typical size, and to watch which average settles and which never does."
        input={
          <div className="space-y-3">
            <Slider label="Tail index alpha" min={1.1} max={3.5} step={0.05} value={alpha} format={(v) => v.toFixed(2)} onChange={(v) => { setAlpha(Math.round(v * 20) / 20); reset(); }} />
            <button type="button" onClick={() => { setSeed((s) => s + 1); reset(); }} className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-leaf">
              Draw another year of claims
            </button>
            <p className="text-[11px] text-muted">
              Sizes are in units of the smallest claim. The comparison draws claims from a thin tail,
              a lognormal, with the same average as the heavy tail's theoretical one, so any
              difference in how the averages behave is the tail and nothing else. Below alpha of two
              the heavy tail's variance is infinite; below one even its mean is.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            limit={N}
            what="claims"
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
                Danish fire insurance, 1980 to 1990: 2,156 losses above a million kroner, fitted by
                McNeil in 1997 with the tail law on this page. The textbook of the method is
                Embrechts, Kluppelberg and Mikosch, 1997. An insurer prices the top of the tail
                separately, often passing it to a reinsurer in layers, because the ordinary average
                says nothing about it.
              </li>
              <li>
                Mandelbrot called the two effects on these pages after two floods. The Noah effect: a
                single event so large it dominates everything, the heavy tail. The Joseph effect:
                seven fat years and seven lean, the long memory of the Hurst page. Both break the
                statistics built on the bell curve and the coin toss, and both are scaling laws with
                one exponent.
              </li>
              <li>
                The link to a coastline. Richardson's coastline has a count of rulers that grows as a
                power of the ruler's shortness; a Pareto tail has a count of claims that shrinks as a
                power of the size. In each the exponent is read off the slope of a log-log plot, and in
                each the picture is the same at every scale. The tail index is the dimension of a
                distribution.
              </li>
              <li>
                What the Bayesian blend of the last page does with this: a customer's expected claim
                cost is frequency times size, and while frequency earns credibility year by year, the
                size's tail cannot be learnt from one customer at all. It is estimated on the whole
                portfolio, and the extreme-value theory of Embrechts and colleagues is how.
              </li>
            </ul>
          </section>
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div>
              <div className="h-[230px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={meanBox}
                  deps={[meanHeavy, meanLight, typical, meanBox]}
                  draw={(pen) => {
                    ticks(pen);
                    if (Number.isFinite(typical)) pen.line([[0, typical], [N, typical]], "#2c3540", 1);
                    pen.line(meanLight, SKY, 1.2);
                    pen.line(meanHeavy, TWO, 1.4);
                    // the claims themselves as faint ticks where they exceed the frame
                    for (let i = 0; i < n; i++) if (heavy[i] > meanTop) pen.line([[i + 1, meanTop * 0.94], [i + 1, meanTop]], TWO, 1);
                    if (meanHeavy.length) pen.dot(n, meanHeavy[meanHeavy.length - 1][1], 3.5, INK);
                  }}
                />
              </div>
              <Caption>{`The running average, claims along the bottom. Rose: the heavy tail, alpha ${alpha.toFixed(2)}. Sky: the thin tail with the same average. The faint line is the heavy tail's theoretical mean${Number.isFinite(typical) ? `, ${typical.toFixed(2)}` : ", which does not exist below alpha of one"}. Rose ticks at the top: claims too large for the frame.`}</Caption>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              <div>
                <div className="h-[220px] overflow-hidden rounded border border-edge">
                  <Plot
                    className="h-full w-full"
                    box={logBox}
                    deps={[surv, survLight, topTenth, alpha, logBox]}
                    draw={(pen) => {
                      ticks(pen, { x: 0.5, y: 1, xFormat: (v) => `${Math.round(Math.pow(10, v))}`, yFormat: (v) => `1e${v.toFixed(0)}` });
                      const toLog = (c: [number, number][]) => c.filter((p) => p[1] > 0 && p[0] > 0).map(([x, y]) => [Math.log10(x), Math.log10(y)] as [number, number]);
                      pen.line(toLog(survLight), SKY, 1.2);
                      pen.line(toLog(surv), TWO, 1.6);
                      pen.line(toLog(topTenth), ONE, 1.2);
                      // the exact law, a straight line of slope minus alpha
                      pen.line([[0, 0], [logBox.x1, -alpha * logBox.x1]], "#4a5560", 1);
                    }}
                  />
                </div>
                <Caption>{`Both axes logarithmic. Along the bottom: a claim size. Up: the fraction of claims at least that large. Rose: the heavy tail, a straight line of slope about minus ${alpha.toFixed(2)}. Sky: the thin tail, bending down. Green: the largest tenth of the heavy claims alone, each divided by the smallest of them: the same line again. Grey: the exact law.`}</Caption>
              </div>
              <div>
                <div className="h-[220px] overflow-hidden rounded border border-edge">
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
                      pen.text(`largest ${largest.toFixed(1)}`, pen.width - 6, 12, MUTED, "right");
                    }}
                  />
                </div>
                <Caption>Every claim as a bar, in the order it came, both rows on the same scale. Top, rose: the heavy tail. Bottom, sky: the thin tail. The heavy row is mostly tiny with a few bars that set the scale for everything.</Caption>
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={n < 50 ? undefined : alpha < 2 ? false : true}>
              {n === 0
                ? `Alpha is ${alpha.toFixed(2)}: ${alpha <= 1 ? "the mean itself does not exist" : alpha < 2 ? "the mean exists but the variance is infinite" : "both the mean and the variance exist"}. Press run and the claims arrive one at a time.`
                : n < 50
                  ? `${n} claims so far. The tail needs fifty to be read.`
                  : `After ${n} claims the heavy average is ${meanHeavy[n - 1][1].toFixed(2)} and the thin one ${meanLight[n - 1][1].toFixed(2)}${Number.isFinite(typical) ? `, both aiming at ${typical.toFixed(2)}` : ""}. The largest heavy claim so far is ${largest.toFixed(1)}, ${(share * 100).toFixed(0)} per cent of everything paid out${share > 0.1 ? ": one claim outweighs hundreds, the Noah effect" : ""}. The tail index read off the slope is ${Number.isFinite(measured) ? measured.toFixed(2) : "-"} against ${alpha.toFixed(2)} set${alpha < 2 ? ", below two: the variance is infinite and the average will never settle, however many claims come. The thin average settled long ago." : ", above two: the average settles, only more slowly than the thin one."} The largest tenth of the claims, rescaled, lie on the same line as all of them: the tail is the same at every scale.`}
            </Verdict>
            <Readout
              rows={[
                ["Tail index alpha, set", alpha.toFixed(2)],
                ["Tail index, read off the slope", Number.isFinite(measured) ? measured.toFixed(3) : "-"],
                ["Theoretical mean", Number.isFinite(typical) ? typical.toFixed(3) : "infinite"],
                ["Theoretical variance", alpha > 2 ? ((alpha * FLOOR * FLOOR) / ((alpha - 1) * (alpha - 1) * (alpha - 2))).toFixed(3) : "infinite"],
                ["Heavy average so far", n ? meanHeavy[n - 1][1].toFixed(3) : "-"],
                ["Thin average so far", n ? meanLight[n - 1][1].toFixed(3) : "-"],
                ["Largest claim, and its share of the total", n ? `${largest.toFixed(2)}, ${(share * 100).toFixed(1)} per cent` : "-"],
                ["Claims above ten times the smallest", n ? `${seen.filter((v) => v > 10 * FLOOR).length}, the law says ${(n * Math.pow(0.1, alpha)).toFixed(1)}` : "-"],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              The straight line on the log-log plot is the whole story: a power law, an exponent, and a
              picture that looks the same at every scale. Richardson found it for the coastline, Pareto
              for incomes, Mandelbrot for prices and floods. The actuary's answer is not to average it
              away but to price the tail as a tail, with the exponent measured on the whole book of
              business rather than on any one customer.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="fractals-tails" />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
