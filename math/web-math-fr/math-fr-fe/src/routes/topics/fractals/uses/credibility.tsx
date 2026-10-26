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
import { claimsOver, credibility, gammaDensity, gammaQuantile, meanOf, posterior, type Prior } from "@/systems/actuary";

export const Route = createFileRoute("/topics/fractals/uses/credibility")({
  loader: () => api.system(TOPIC, "credibility"),
  component: CredibilityPage,
});

const YEARS = 40;

function CredibilityPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [mu, setMu] = useState(0.1);
  const [k, setK] = useState(20);
  const [truth, setTruth] = useState(0.3);
  const [seed, setSeed] = useState(4);
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(0.15);

  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: YEARS });
  const n = Math.min(shown, YEARS);
  // the group's belief about a customer it has never seen: mean mu, and k says how alike customers are
  const prior = useMemo<Prior>(() => ({ shape: mu * k, rate: k }), [mu, k]);
  const claims = useMemo(() => claimsOver(truth, YEARS, seed), [truth, seed]);
  const totals = useMemo(() => {
    const out = [0];
    for (const c of claims) out.push(out[out.length - 1] + c);
    return out;
  }, [claims]);
  const post = useMemo(() => posterior(prior, n, totals[n]), [prior, n, totals]);
  const Z = credibility(n, k);
  const own = n > 0 ? totals[n] / n : 0;
  const estimate = meanOf(post);
  const band = useMemo(() => [gammaQuantile(post, 0.05), gammaQuantile(post, 0.95)] as [number, number], [post]);
  const history = useMemo(() => {
    const rows: { year: number; est: number; lo: number; hi: number; own: number }[] = [];
    for (let y = 0; y <= n; y++) {
      const p = posterior(prior, y, totals[y]);
      rows.push({ year: y, est: meanOf(p), lo: gammaQuantile(p, 0.05), hi: gammaQuantile(p, 0.95), own: y ? totals[y] / y : mu });
    }
    return rows;
  }, [prior, totals, n, mu]);
  const top = Math.max(truth * 1.6, mu * 3, 0.5, ...history.map((h) => Math.min(h.own, 1.5)));
  const seriesBox: Box = { x0: 0, x1: YEARS, y0: 0, y1: top };
  const densityTop = useMemo(() => {
    let m = 0;
    for (let i = 1; i <= 200; i++) m = Math.max(m, gammaDensity(post, (i / 200) * top));
    return m * 1.1;
  }, [post, top]);
  const inside = truth >= band[0] && truth <= band[1];
  const reset = () => {
    runner.reset();
    setShown(0);
  };

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("Trust the group or trust the record: an actuary's Bayes")}
        job={L("Insurance is many people paying a little so that the few who are hit hard are paid. The person who sets the price is an actuary, and the first question is how often a customer will claim. A new customer has a short record: one year, no claims, or one year, one claim. The group they belong to has a long one. Trust the record alone and the price swings wildly; trust the group alone and a careful customer pays for a careless one. The answer written down by Whitney in 1918 and made exact by Bailey and Buhlmann is a weighted average, with the weight on the record growing as the years come. The job is to watch the years arrive and the weight move.")}
        input={
          <div className="space-y-3">
            <Slider label={L("The group's rate")} min={0.02} max={0.5} step={0.01} value={mu} format={(v) => L("{{v}} claims a year", { v: v.toFixed(2) })} onChange={(v) => { setMu(Math.round(v * 100) / 100); reset(); }} />
            <Slider label={L("How alike the customers are, k")} min={2} max={80} step={1} value={k} format={(v) => `k = ${Math.round(v)}`} onChange={(v) => { setK(Math.round(v)); reset(); }} />
            <Slider label={L("This customer's true rate")} min={0.02} max={1} step={0.01} value={truth} format={(v) => L("{{v}} a year", { v: v.toFixed(2) })} onChange={(v) => { setTruth(Math.round(v * 100) / 100); reset(); }} />
            <Button variant="outline" size="sm" type="button" onClick={() => { setSeed((s) => s + 1); reset(); }}>
              {L("Draw another customer")}
            </Button>
            <Text kind="note" as="p">
              {L("The true rate is known to the page and hidden from the actuary, who sees only the claims. k is the number of years of record it takes for the record to earn half the weight: large when customers are much alike, so one record says little; small when they differ a lot, so a record is believed quickly.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            limit={YEARS}
            what={L("years of record")}
            pace="slow"
            onToggle={() => {
              if (!runner.running && n >= YEARS) reset();
              runner.toggle();
            }}
            onStep={(many) => setShown((v) => Math.min(YEARS, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        more={
          <section data-slot="panel">
            <Label>{L("WHAT AN ACTUARY DOES")}</Label>
            <ul data-text="note" className="mt-2 space-y-2">
              <li>
                {L("Three questions, all about money that depends on chance. Pricing: what to charge so that the claims are covered and the careful are not made to pay for the careless. Reserving: how much to set aside for accidents that have already happened but not yet been paid for, which for some kinds of insurance takes years to know. Mortality: how long people will live, for pensions and life insurance.")}
              </li>
              <li>
                {L("This page is pricing, and the oldest tool in it. Whitney proposed the weighted average in 1918 with the weight set by judgement; Bailey showed in 1950 that it is what Bayes' rule gives when claims are counted as Poisson and the rates across customers are spread as a gamma; Buhlmann showed in 1967 that it is the best straight-line estimate whatever the distributions are. The weight is called the credibility.")}
              </li>
              <li>
                {L("The same blend appears in the other two questions. Money set aside for unpaid claims is estimated either from the year's own pattern (the chain ladder) or from a prior expectation (Bornhuetter and Ferguson, 1972), and Mack showed in 2000 that the best of both is a credibility mixture with the fraction already reported as the weight. Bayesian versions of the standard mortality model (Lee and Carter, 1992; Czado, Delwarde and Denuit, 2005) widen their forecasts to admit that the model's own numbers are uncertain, which the plain version does not.")}
              </li>
              <li>
                {L("Why it sits in the fractals topic: the next page. The size of a claim, as opposed to how often one comes, has a tail that looks the same at every scale, and the average of such claims never settles. An actuary who prices with a bell curve where the tail is Pareto is the reservoir sized by the coin-toss rule.")}
              </li>
            </ul>
          </section>
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div>
              <div data-slot="plot" className="h-[260px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={seriesBox}
                  deps={[history, truth, mu, seriesBox]}
                  draw={(pen) => {
                    ticks(pen, { x: 5 });
                    const { ctx } = pen;
                    // the band of belief, then the lines
                    if (history.length > 1) {
                      ctx.beginPath();
                      history.forEach((h, i) => (i ? ctx.lineTo(pen.px(h.year), pen.py(Math.min(top, h.hi))) : ctx.moveTo(pen.px(h.year), pen.py(Math.min(top, h.hi)))));
                      for (let i = history.length - 1; i >= 0; i--) ctx.lineTo(pen.px(history[i].year), pen.py(history[i].lo));
                      ctx.closePath();
                      ctx.fillStyle = ONE;
                      ctx.globalAlpha = 0.12;
                      ctx.fill();
                      ctx.globalAlpha = 1;
                    }
                    pen.line([[0, mu], [YEARS, mu]], MUTED, 1);
                    pen.line([[0, truth], [YEARS, truth]], TWO, 1);
                    pen.line(history.map((h) => [h.year, Math.min(top, h.own)] as [number, number]), SKY, 1);
                    pen.line(history.map((h) => [h.year, h.est] as [number, number]), ONE, 2);
                    // the claims, as ticks at the foot
                    for (let y = 1; y <= n; y++) for (let c = 0; c < claims[y - 1]; c++) pen.line([[y, seriesBox.y0 + c * top * 0.03], [y, seriesBox.y0 + (c + 0.8) * top * 0.03]], INK, 2);
                    if (history.length) {
                      const h = history[history.length - 1];
                      pen.dot(h.year, h.est, 4, INK);
                    }
                  }}
                />
              </div>
              <Caption>{L("Years of record along the bottom, claims a year up. Grey: the group's rate. Sky: this customer's own record, claims so far over years so far. Green: the actuary's estimate, the blend, with the band it is nine in ten sure of shaded behind. Rose: the true rate, which the actuary never sees. White ticks at the foot: the claims, one tick each.")}</Caption>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              <div>
                <div data-slot="plot" className="h-[200px] overflow-hidden">
                  <Plot
                    className="h-full w-full"
                    box={{ x0: 0, x1: top, y0: 0, y1: densityTop }}
                    deps={[post, prior, truth, top, densityTop]}
                    draw={(pen) => {
                      ticks(pen, { y: densityTop * 2 });
                      const curve = (g: Prior) => {
                        const pts: [number, number][] = [];
                        for (let i = 1; i <= 200; i++) {
                          const x = (i / 200) * top;
                          pts.push([x, Math.min(densityTop, gammaDensity(g, x))]);
                        }
                        return pts;
                      };
                      pen.line(curve(prior), MUTED, 1);
                      pen.line(curve(post), ONE, 1.8);
                      pen.line([[truth, 0], [truth, densityTop]], TWO, 1);
                      pen.line([[estimate, 0], [estimate, densityTop]], INK, 1);
                    }}
                  />
                </div>
                <Caption>{L("The belief as a curve: how likely each rate is thought to be. Grey: before any record, the group's spread. Green: after the years so far, narrowing. White: its centre, the estimate. Rose: the truth.")}</Caption>
              </div>
              <div>
                <div data-slot="plot" className="h-[200px] overflow-hidden">
                  <Plot
                    className="h-full w-full"
                    box={{ x0: 0, x1: YEARS, y0: 0, y1: 1 }}
                    deps={[k, n]}
                    draw={(pen) => {
                      ticks(pen, { x: 5, y: 0.25 });
                      const pts: [number, number][] = [];
                      for (let y = 0; y <= YEARS; y++) pts.push([y, credibility(y, k)]);
                      pen.line(pts, ONE, 1.6);
                      pen.line([[0, 0.5], [YEARS, 0.5]], "#2c3540", 1);
                      pen.line([[Math.min(k, YEARS), 0], [Math.min(k, YEARS), 1]], "#2c3540", 1);
                      pen.dot(n, credibility(n, k), 4, INK);
                    }}
                  />
                </div>
                <Caption>{L("The weight on the record, the credibility Z = n / (n + k), against the years n. It is one half at n = k, here {{k}}{{beyond}}. White: where the run is now.", { k, beyond: k > YEARS ? L(", beyond the run") : "" })}</Caption>
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={n === 0 ? undefined : inside}>
              {n === 0
                ? L("No record yet. The actuary's only estimate is the group's rate, {{mu}} claims a year, with the weight on the record at zero. Press run and the years arrive one at a time.", { mu: mu.toFixed(2) })
                : `${L("After {{years}} with {{claims}}: the record alone says {{own}} a year, the group says {{mu}}, and the record has earned {{z}} per cent of the weight, so the estimate is {{est}}.", { years: n === 1 ? L("1 year") : L("{{n}} years", { n }), claims: totals[n] === 1 ? L("1 claim") : L("{{n}} claims", { n: totals[n] }), own: own.toFixed(2), mu: mu.toFixed(2), z: (Z * 100).toFixed(0), est: estimate.toFixed(3) })} ${L("The actuary is nine in ten sure the rate is between {{lo}} and {{hi}}{{where}}.", { lo: band[0].toFixed(2), hi: band[1].toFixed(2), where: inside ? L(", and the true rate, {{t}}, is inside that band", { t: truth.toFixed(2) }) : L(", and the true rate, {{t}}, is outside it: this customer's record has been unlucky or lucky so far", { t: truth.toFixed(2) }) })} ${Z >= 0.5 ? L("The record now counts for more than the group.") : L("The group still counts for more; the record catches up at year {{k}}.", { k })}`}
            </Verdict>
            <Readout
              rows={[
                [L("The blend"), `${Z.toFixed(3)} × ${own.toFixed(3)} + ${(1 - Z).toFixed(3)} × ${mu.toFixed(3)} = ${estimate.toFixed(4)}`],
                [L("Credibility Z = n / (n + k)"), `${n} / (${n} + ${k}) = ${Z.toFixed(3)}`],
                [L("Belief before any record"), L("gamma, shape {{shape}}, rate {{rate}}, mean {{mean}}", { shape: prior.shape.toFixed(2), rate: prior.rate, mean: mu.toFixed(3) })],
                [L("Belief now"), L("gamma, shape {{shape}}, rate {{rate}}, mean {{mean}}", { shape: post.shape.toFixed(2), rate: post.rate, mean: estimate.toFixed(4) })],
                [L("Nine-in-ten band"), L("{{lo}} to {{hi}}", { lo: band[0].toFixed(3), hi: band[1].toFixed(3) })],
                [L("True rate, hidden from the actuary"), truth.toFixed(2)],
                [L("Half weight reached at"), L("{{n}} years", { n: k })],
                [L("Claims so far"), L("{{claims}} in {{n}} years", { claims: totals[n], n })],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("With claims counted as Poisson and the rates across the group spread as a gamma, the blend is not an approximation: the belief after the record is again a gamma, its mean is exactly the weighted average, and k is the gamma's rate. Turn k down to see a record believed almost at once; turn it up to see a customer priced as the group for decades.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="fractals-credibility" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
