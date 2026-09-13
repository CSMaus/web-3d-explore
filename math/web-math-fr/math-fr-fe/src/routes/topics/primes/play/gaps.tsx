import { createFileRoute } from "@tanstack/react-router";
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
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { INK, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { PRIMES, TOPIC } from "@/lib/primes";
import { useRunner } from "@/lib/runner";
import { logistic, orbit } from "@/systems/maps";
import { firstPrimes, gaps, histogram, predictability, returnPairs, shuffled } from "@/systems/primes";

export const Route = createFileRoute("/topics/primes/play/gaps")({
  loader: () => api.system(TOPIC, "gaps"),
  component: GapsPage,
});

const RIVALS = [
  { id: "logistic", label: "Compare with the logistic map at r = 4" },
  { id: "shuffled", label: "Compare with the same gaps shuffled" },
];

function GapsPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [count, setCount] = useState(3000);
  const [rival, setRival] = useState("logistic");
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(8);

  const primes = useMemo(() => firstPrimes(count), [count]);
  const all = useMemo(() => gaps(primes), [primes]);
  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: all.length });
  const n = Math.min(shown, all.length);
  const seen = useMemo(() => all.slice(0, n), [all, n]);
  const pairs = useMemo(() => returnPairs(seen), [seen]);
  const hist = useMemo(() => histogram(seen), [seen]);
  const largest = seen.length ? Math.max(...seen) : 2;
  const top = useMemo(() => Math.max(...all) + 2, [all]);
  const box = useMemo<Box>(() => ({ x0: 0, x1: top, y0: 0, y1: top }), [top]);

  // the rival picture: something with a rule, or the same numbers with their order destroyed
  const rivalPairs = useMemo<[number, number][]>(() => {
    if (rival === "logistic") {
      const xs = Array.from(orbit(logistic(4), 0.1234567, Math.max(2, n), 50));
      return returnPairs(xs);
    }
    return returnPairs(shuffled(seen));
  }, [rival, n, seen]);
  const rivalBox: Box = rival === "logistic" ? { x0: 0, x1: 1, y0: 0, y1: 1 } : box;

  const rho = useMemo(() => predictability(seen), [seen]);
  const rhoRival = useMemo(() => (rival === "logistic" ? { ratio: 0, used: rivalPairs.length } : predictability(shuffled(seen))), [rival, rivalPairs.length, seen]);
  const meanGap = seen.length ? seen.reduce((a, b) => a + b, 0) / seen.length : 0;
  const lnP = n > 0 ? Math.log(primes[n]) : 0;
  const histTop = Math.max(1, ...Array.from(hist.values())) * 1.1;

  const reset = () => {
    runner.reset();
    setShown(0);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={PRIMES} />
      <TaskPage
        title={system?.name ?? "The gaps between primes, as a return map"}
        job="The primes look patternless, and so does a chaotic sequence. This page tells them apart with the picture the Rossler page used: each gap between consecutive primes plotted against the next. A sequence that follows a rule, however sensitive, lands on a curve. Beside it, for comparison, a sequence that really has a rule, or the same gaps with their order destroyed."
        input={
          <div className="space-y-3">
            <Slider label="Primes" min={200} max={20000} step={200} value={count} format={(v) => v.toLocaleString("en")} onChange={(v) => { setCount(Math.round(v)); reset(); }} />
            <Choices options={RIVALS} value={rival} onPick={setRival} />
            <p className="text-[11px] text-muted">
              The left picture is always the real primes, found by a sieve as the run goes. The
              right picture is a comparison of your choice: the logistic map at r = 4, which is
              chaotic and follows a rule, or the real gaps again with their order shuffled, to
              test whether the order in which the gaps come carries anything.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            limit={all.length}
            what="gaps placed"
            onToggle={() => {
              if (!runner.running && n >= all.length) reset();
              runner.toggle();
            }}
            onStep={(many) => setShown((v) => Math.min(all.length, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="grid gap-2 lg:grid-cols-2">
              <div>
                <div className="h-[300px] overflow-hidden rounded border border-edge">
                  <Plot
                    className="h-full w-full"
                    box={box}
                    equal
                    deps={[pairs, box]}
                    draw={(pen) => {
                      ticks(pen);
                      pen.line([[0, 0], [top, top]], "#2c3540", 1);
                      for (const [a, b] of pairs) pen.dot(a, b, 1.6, SKY);
                      if (pairs.length) {
                        const last = pairs[pairs.length - 1];
                        pen.ring(last[0], last[1], 6, INK, 1.5);
                      }
                    }}
                  />
                </div>
                <Caption>The real primes. Along the bottom: a gap between two consecutive primes. Up: the gap that comes right after it. One dot a pair, {pairs.length.toLocaleString("en")} so far. Every dot sits on a grid of even numbers, and no curve runs through them.</Caption>
              </div>
              <div>
                <div className="h-[300px] overflow-hidden rounded border border-edge">
                  <Plot
                    className="h-full w-full"
                    box={rivalBox}
                    equal
                    deps={[rivalPairs, rivalBox]}
                    draw={(pen) => {
                      ticks(pen);
                      pen.line([[rivalBox.x0, rivalBox.x0], [rivalBox.x1, rivalBox.x1]], "#2c3540", 1);
                      for (const [a, b] of rivalPairs) pen.dot(a, b, 1.6, rival === "logistic" ? ONE : TWO);
                    }}
                  />
                </div>
                <Caption>
                  {rival === "logistic"
                    ? "The comparison: the logistic map at r = 4 for the same number of steps. Along the bottom: a value. Up: the next value. Chaotic, and every point on one curve, because there is a rule."
                    : "The comparison: the same real gaps, only in a random order, drawn the same way. The cloud is the same cloud, so the order the gaps come in carries nothing this picture can see."}
                </Caption>
              </div>
            </div>
            <div>
              <div className="h-[150px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={{ x0: 0, x1: top, y0: 0, y1: histTop }}
                  deps={[hist, top, histTop]}
                  draw={(pen) => {
                    ticks(pen, { x: 10 });
                    for (const [g, c] of hist) {
                      const x0 = pen.px(g - 0.8);
                      const x1 = pen.px(g + 0.8);
                      pen.ctx.fillStyle = SKY;
                      pen.ctx.fillRect(x0, pen.py(c), Math.max(1, x1 - x0), pen.py(0) - pen.py(c));
                    }
                  }}
                />
              </div>
              <Caption>The real primes again. Along the bottom: the size of a gap, 2, 4, 6 and so on. Up: how many times a gap of that size has occurred so far. Six is the commonest for a long way; the largest so far is {largest}.</Caption>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {n === 0
                ? `${count.toLocaleString("en")} primes are ready. Press run and the gaps are placed one at a time.`
                : `After ${n.toLocaleString("en")} gaps, knowing one gap narrows the next to ${(rho.ratio * 100).toFixed(0)} per cent of its usual spread: ${rho.ratio > 0.9 ? "almost nothing is gained" : "a little is gained"}. ${rival === "logistic" ? "For the logistic map the same number is zero: this value fixes the next exactly, and the picture is a curve." : `For the shuffled gaps it is ${(rhoRival.ratio * 100).toFixed(0)} per cent, the same within noise: the order of the primes carries no rule the next gap can be read from.`} The primes are not chaotic. They are something else: a fixed list with no rule of this kind behind it.`}
            </Verdict>
            <Readout
              rows={[
                ["Primes placed", `${Math.min(n + 1, primes.length).toLocaleString("en")} of ${primes.length.toLocaleString("en")}`],
                ["Largest prime so far", n > 0 ? primes[n].toLocaleString("en") : "-"],
                ["Mean gap so far", meanGap.toFixed(2)],
                ["Log of the largest prime, the expected spacing", lnP.toFixed(2)],
                ["Largest gap so far", String(largest)],
                ["Spread of the next gap, knowing this one", `${(rho.ratio * 100).toFixed(1)} per cent of the spread knowing nothing`],
                ["The same for the comparison", rival === "logistic" ? "0 per cent: a rule" : `${(rhoRival.ratio * 100).toFixed(1)} per cent`],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              Chaos is a rule with a positive exponent: the Lorenz page followed two starts a hair
              apart along the same rule and watched them part. The primes offer no rule to follow
              and no start to nudge, so neither an exponent nor a return map applies. Looking random
              and being chaotic are different things, and this picture is the test.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="prime-gaps" />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
