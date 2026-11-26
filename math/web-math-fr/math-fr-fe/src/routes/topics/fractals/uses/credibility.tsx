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
        title={system?.name ?? L("How much to trust a new customer's own record")}
        job={L("How should an insurer price a customer who has only a year or two of history? Insurance is many people each paying a little, so that the few who suffer a loss are paid. The price is set by an actuary, and the first question is how often this customer will make a claim, a request for payment after a loss. A new customer has a short record: one year with no claims, or one year with one claim. The group the customer belongs to has a long record. Trusting the short record alone makes the price jump wildly. Trusting the group alone makes a careful customer pay for a careless one. The answer, written down by Whitney in 1918 and made exact by Bailey and Buhlmann, is a weighted average: a mix of the two rates in which the share given to the customer's own record grows as the years pass. This share is called the credibility. On this page the years arrive one at a time, and the share moves.")}
        input={
          <div className="space-y-3">
            <Slider label={L("Group's average claim rate")} min={0.02} max={0.5} step={0.01} value={mu} format={(v) => L("{{v}} claims a year", { v: v.toFixed(2) })} onChange={(v) => { setMu(Math.round(v * 100) / 100); reset(); }} />
            <Slider label={L("How alike customers are (k)")} min={2} max={80} step={1} value={k} format={(v) => `k = ${Math.round(v)}`} onChange={(v) => { setK(Math.round(v)); reset(); }} />
            <Slider label={L("This customer's true claim rate")} min={0.02} max={1} step={0.01} value={truth} format={(v) => L("{{v}} a year", { v: v.toFixed(2) })} onChange={(v) => { setTruth(Math.round(v * 100) / 100); reset(); }} />
            <Button variant="outline" size="sm" type="button" onClick={() => { setSeed((s) => s + 1); reset(); }}>
              {L("Draw another customer")}
            </Button>
            <Text kind="note" as="p">
              {L("The first slider sets the group's average number of claims per customer per year. The third sets this customer's true rate. The page knows the true rate; the actuary does not and sees only the claims. The second slider sets k: the number of years of record it takes for the record to earn half the weight. k is large when customers are much alike, so one customer's record says little. k is small when customers differ a lot, so a record is believed quickly.")}
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
            onStep={(many) => runner.once(many)}
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
                {L("An actuary answers three questions, all about money that depends on chance. Pricing: what to charge, so that claims are covered and careful customers do not pay for careless ones. Reserving: how much to set aside for accidents that have already happened but are not yet paid for; for some kinds of insurance this takes years to find out. Mortality: how long people will live, for pensions and life insurance.")}
              </li>
              <li>
                {L("This page is about pricing, and shows its oldest tool. Whitney proposed the weighted average in 1918, with the weight set by judgement. In 1950 Bailey showed that it is exactly what Bayes' rule gives. Bayes' rule is the rule for updating a belief with new evidence. It gives this mix when claims are counted with a Poisson model, in which claims come at random and independently, and when the rates across customers follow a gamma distribution, a standard shape for a spread of positive numbers. In 1967 Buhlmann showed that it is the best estimate of straight-line form whatever the distributions are. The weight is called the credibility.")}
              </li>
              <li>
                {L("The same mix appears in the other two questions. Money set aside for claims not yet paid is estimated either from the pattern of the year itself, by a method called the chain ladder, or from an expectation fixed in advance (Bornhuetter and Ferguson, 1972). In 2000 Mack showed that the best of both is a credibility mix, with the share of claims already reported as the weight. Bayesian versions of the standard model of mortality (Lee and Carter, 1992; Czado, Delwarde and Denuit, 2005) widen their forecasts to admit that the model's own numbers are uncertain, which the plain version does not do.")}
              </li>
              <li>
                {L("Why this page belongs to the topic on fractals. The size of a claim, as opposed to how often claims come, has a tail that looks the same at every scale: among large claims, the larger ones thin out in the same way at every size, and the average of such claims never settles. A page on the same topic, 'Rare huge claims', shows this. An actuary who prices with a bell curve where the true tail is a Pareto tail makes the same mistake as an engineer who sizes a reservoir as if wet and dry years were coin tosses.")}
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
                    pen.ctx.setLineDash([8, 5]);
                    pen.line([[0, mu], [YEARS, mu]], MUTED, 1);
                    pen.ctx.setLineDash([1.5, 3]);
                    pen.line([[0, truth], [YEARS, truth]], TWO, 1.5);
                    pen.ctx.setLineDash([]);
                    pen.line(history.map((h) => [h.year, Math.min(top, h.own)] as [number, number]), SKY, 1);
                    pen.line(history.map((h) => [h.year, h.est] as [number, number]), ONE, 2.4);
                    // the claims, as ticks at the foot
                    for (let y = 1; y <= n; y++) for (let c = 0; c < claims[y - 1]; c++) pen.line([[y, seriesBox.y0 + c * top * 0.03], [y, seriesBox.y0 + (c + 0.8) * top * 0.03]], INK, 2);
                    if (history.length) {
                      const h = history[history.length - 1];
                      pen.dot(h.year, h.est, 4, INK);
                    }
                  }}
                />
              </div>
              <Caption>{L("Years of record along the bottom, claims per year up the side. Long-dashed horizontal line: the group's average rate. Dotted horizontal line: this customer's true rate, which the actuary never sees. Thin wandering line: the customer's own record, claims so far divided by years so far. Thick line: the actuary's estimate, the mix of the two, with a shaded band where the actuary is nine in ten sure the true rate lies. Short marks at the bottom: the claims, one mark each.")}</Caption>
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
                      pen.ctx.setLineDash([5, 4]);
                      pen.line(curve(prior), MUTED, 1);
                      pen.ctx.setLineDash([]);
                      pen.line(curve(post), ONE, 2.4);
                      pen.ctx.setLineDash([1.5, 3]);
                      pen.line([[truth, 0], [truth, densityTop]], TWO, 1.5);
                      pen.ctx.setLineDash([]);
                      pen.line([[estimate, 0], [estimate, densityTop]], INK, 1);
                    }}
                  />
                </div>
                <Caption>{L("The actuary's belief as a curve: how likely each claim rate is thought to be, with the rate along the bottom. Dashed curve: the belief before any record, the spread of rates across the group. Thick curve: the belief after the years so far, narrowing as the years arrive. Thin vertical line: its centre, the estimate. Dotted vertical line: the true rate.")}</Caption>
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
                <Caption>{L("The weight given to the record, called the credibility Z, against the number of years of record n: Z = n / (n + k). Z is one half when n equals k, here {{k}} years{{beyond}}. Faint lines mark one half and n = k. The dot marks the current year.", { k, beyond: k > YEARS ? L(", beyond the 40 years shown") : "" })}</Caption>
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={n === 0 ? undefined : inside}>
              {n === 0
                ? L("No record yet. The actuary's only estimate is the group's rate, {{mu}} claims a year, and the record has a weight of zero. Press run and the years arrive one at a time.", { mu: mu.toFixed(2) })
                : `${L("After {{years}} with {{claims}}: the record alone gives {{own}} claims a year, the group gives {{mu}}, and the record has earned {{z}} per cent of the weight, so the estimate is {{est}}.", { years: n === 1 ? L("1 year") : L("{{n}} years", { n }), claims: totals[n] === 1 ? L("1 claim") : L("{{n}} claims", { n: totals[n] }), own: own.toFixed(2), mu: mu.toFixed(2), z: (Z * 100).toFixed(0), est: estimate.toFixed(3) })} ${L("The actuary is nine in ten sure the rate is between {{lo}} and {{hi}}{{where}}.", { lo: band[0].toFixed(2), hi: band[1].toFixed(2), where: inside ? L(", and the true rate, {{t}}, is inside that band", { t: truth.toFixed(2) }) : L(", and the true rate, {{t}}, is outside it: this customer's claims so far have been unusually few or unusually many", { t: truth.toFixed(2) }) })} ${Z >= 0.5 ? L("The record now counts for more than the group.") : L("The group still counts for more. The record catches up in year {{k}}.", { k })}`}
            </Verdict>
            <Readout
              rows={[
                [L("Estimate: weight × own rate + (1 - weight) × group rate"), `${Z.toFixed(3)} × ${own.toFixed(3)} + ${(1 - Z).toFixed(3)} × ${mu.toFixed(3)} = ${estimate.toFixed(4)}`],
                [L("Weight on the record, Z = n / (n + k)"), `${n} / (${n} + ${k}) = ${Z.toFixed(3)}`],
                [L("Belief before any record"), L("gamma curve, shape {{shape}}, rate parameter {{rate}}, centre {{mean}}", { shape: prior.shape.toFixed(2), rate: prior.rate, mean: mu.toFixed(3) })],
                [L("Belief now"), L("gamma curve, shape {{shape}}, rate parameter {{rate}}, centre {{mean}}", { shape: post.shape.toFixed(2), rate: post.rate, mean: estimate.toFixed(4) })],
                [L("Range the actuary is nine in ten sure of"), L("{{lo}} to {{hi}}", { lo: band[0].toFixed(3), hi: band[1].toFixed(3) })],
                [L("True rate, hidden from the actuary"), truth.toFixed(2)],
                [L("Record reaches half the weight after"), L("{{n}} years", { n: k })],
                [L("Claims so far"), L("{{claims}} in {{n}} years", { claims: totals[n], n })],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("With claims counted by the Poisson model and the rates across the group spread as a gamma curve, the mix is not an approximation. The belief after the record is again a gamma curve, its centre is exactly the weighted average, and k is the gamma curve's rate parameter. A small k makes the record believed almost at once. A large k keeps a customer priced as the group for decades.")}
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
