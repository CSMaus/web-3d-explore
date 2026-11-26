import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
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
import { INK, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/primes";
import { useRunner } from "@/lib/runner";
import { logistic, orbit } from "@/systems/maps";
import { firstPrimes, gaps, histogram, predictability, returnPairs, shuffled } from "@/systems/primes";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/primes/play/gaps")({
  loader: () => api.system(TOPIC, "gaps"),
  component: GapsPage,
});

const RIVALS = [
  { id: "logistic", label: L("Compare with a chaotic rule: the logistic map, r = 4") },
  { id: "shuffled", label: L("Compare with the same gaps in a random order") },
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
    <div>
      <TaskPage
        title={system?.name ?? L("Can one gap between primes predict the next?")}
        job={L("Can the gap to the next prime number be guessed from the gap before it? A prime number is a whole number above 1 that divides evenly only by 1 and by itself: 2, 3, 5, 7, 11, 13 and so on. The gap between two neighbouring primes is their difference: from 7 to 11 the gap is 4, from 11 to 13 it is 2. The gaps grow and shrink with no visible order. A sequence made by a strict rule can also change with no visible order. Such a rule is called chaotic. This page tells the two cases apart. Each gap is drawn as a dot against the gap that comes after it. If a rule gave the next gap, all the dots would lie on one curved line. The slider sets how many primes are used, from 200 to 20,000. Pressing Run draws the gaps one at a time. Beside the primes, a second picture shows for comparison a chaotic rule, or the same gaps in a random order. The thing to look for: do the dots of the primes line up on a curve, or scatter in a cloud?")}
        input={
          <div className="space-y-3">
            <Slider label={L("Number of primes used")} min={200} max={20000} step={200} value={count} format={(v) => v.toLocaleString("en")} onChange={(v) => { setCount(Math.round(v)); reset(); }} />
            <Choices options={RIVALS} value={rival} onPick={setRival} />
            <Text kind="note" as="p">
              {L("The first picture always shows the real primes. The page finds them itself by the sieve of Eratosthenes: in the list of whole numbers, the multiples of 2, of 3, of 5 and so on are crossed out, and the numbers left are the primes. The two buttons above choose what the second picture shows. The first button shows the logistic map with r = 4. It is a rule that takes a number x between 0 and 1 and gives the next number, 4 × x × (1 - x). This rule is chaotic: two starting numbers that differ by a tiny amount give sequences that soon have nothing in common. The second button shows the real prime gaps again, mixed into a random order. This checks whether the order in which the gaps come carries any information.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            limit={all.length}
            what={L("gaps drawn")}
            onToggle={() => {
              if (!runner.running && n >= all.length) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="grid gap-2 lg:grid-cols-2">
              <div>
                <div data-slot="plot" className="h-[300px] overflow-hidden">
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
                <Caption>{L("First picture, the real primes. Each dot is one pair of neighbouring gaps. Along the bottom: a gap between two neighbouring primes. Up: the gap that comes right after it. {{n}} pairs so far, and many of them fall on the same spot. The newest dot is circled. The thin diagonal line marks where the two gaps are equal. Apart from the very first dot, (1, 2), all the dots sit at even numbers, and they do not line up along any curve.", { n: pairs.length.toLocaleString("en") })}</Caption>
              </div>
              <div>
                <div data-slot="plot" className="h-[300px] overflow-hidden">
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
                    ? L("Second picture, the comparison: the chaotic rule, the logistic map with r = 4, run for the same number of steps. Along the bottom: a value x between 0 and 1. Up: the value the rule gives next. The values jump around with no visible order, yet every dot lies on one curved line, because the rule fixes each next value.")
                    : L("Second picture, the comparison: the same real gaps, mixed into a random order and drawn the same way. The cloud looks the same as in the first picture. So the order in which the gaps come shows nothing that this picture can detect.")}
                </Caption>
              </div>
            </div>
            <div>
              <div data-slot="plot" className="h-[150px] overflow-hidden">
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
              <Caption>{L("Third picture, the real primes again. Along the bottom: the size of a gap, 2, 4, 6 and so on. Up: how many times a gap of that size has come up so far. Such a bar chart of counts is called a histogram. From 161 primes on, the gap 6 is the most common. The largest gap so far is {{largest}}.", { largest })}</Caption>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {n === 0
                ? L("{{n}} primes are ready. Pressing Run draws the gaps between them one at a time.", { n: count.toLocaleString("en") })
                : `${rho.ratio > 0.9 ? L("After {{n}} gaps, knowing one gap tells almost nothing about the next.", { n: n.toLocaleString("en") }) : L("After {{n}} gaps, knowing one gap tells only a little about the next.", { n: n.toLocaleString("en") })} ${L("Knowing the current gap reduces the spread of the next gap only to {{pct}} per cent of its full size. The spread is how far the next gap typically lies from its average. 100 per cent would mean no help, 0 per cent an exact prediction.", { pct: (rho.ratio * 100).toFixed(0) })} ${rival === "logistic" ? L("For the chaotic rule the same number is 0 per cent: each value fixes the next exactly, so its dots form one curved line.") : L("For the same gaps in a random order it is {{pct}} per cent, the same up to chance differences. So the order of the gaps carries no rule from which the next gap could be read.", { pct: (rhoRival.ratio * 100).toFixed(0) })} ${L("The primes are not chaotic: a chaotic sequence is made by a rule, and the primes are a fixed list with no rule of this kind behind them.")}`}
            </Verdict>
            <Readout
              rows={[
                [L("Primes used so far"), L("{{a}} of {{b}}", { a: Math.min(n + 1, primes.length).toLocaleString("en"), b: primes.length.toLocaleString("en") })],
                [L("Largest prime so far"), n > 0 ? primes[n].toLocaleString("en") : "-"],
                [L("Average gap so far"), meanGap.toFixed(2)],
                [L("Expected average gap: natural logarithm of the largest prime"), lnP.toFixed(2)],
                [L("Largest gap so far"), String(largest)],
                [L("Spread of the next gap when the current one is known"), L("{{pct}} per cent of its spread when nothing is known", { pct: (rho.ratio * 100).toFixed(1) })],
                [L("The same measure for the comparison picture"), rival === "logistic" ? L("0 per cent: the rule fixes the next value") : L("{{pct}} per cent", { pct: (rhoRival.ratio * 100).toFixed(1) })],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("A sequence is called chaotic when a strict rule makes it, and two almost equal starting values soon lead to completely different sequences. The speed at which such sequences move apart is called the Lyapunov exponent. For a chaotic rule it is positive. The primes have no such rule, and no starting value that could be changed a little. So there is no exponent to measure, and the picture of each gap against the next shows no curve. Looking random and being chaotic are different things. The spread in the numbers above is the standard deviation: how far the values typically lie from their average. For the next gap it is computed twice: over all gaps, and separately for each size of the current gap. Only sizes seen at least 8 times are counted.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="prime-gaps" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
