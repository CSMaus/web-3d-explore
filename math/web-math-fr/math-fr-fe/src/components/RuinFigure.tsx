import { useMemo, useState } from "react";
import { Text, Badge, Button, Caption, Choices, Field, Figure, Panel, Plot as Frame, Readout, Verdict } from "@kit/index";
import { Plot, type Box } from "@/components/Plot";
import { FAINT, INK, MUTED, ONE, TWO, ticks } from "@/lib/draw";
import { expectedCeded, lundbergRuin, trial, type Cover, type Terms, type World } from "@/systems/ruin";

/**
 * the reader's experiment inside the insurance piece: a thousand insurers with
 * the same capital and premium, in one of three worlds, and how many of them
 * are ruined; then a reinsurance layer bought against the large claims. every
 * number is computed here when the button is pressed.
 */

const WORLDS = [
  { id: "classical", label: "Independent, ordinary claims" },
  { id: "heavy", label: "Heavy-tailed claims" },
  { id: "clustered", label: "Years that cluster" },
  { id: "both", label: "Both at once" },
] as const;
type WorldId = (typeof WORLDS)[number]["id"];
const WORLD_OPTIONS: { id: WorldId; label: string }[] = [...WORLDS];

const RUNS = 1000;
const YEARS = 30;
const RATE = 20;
const MEAN = 1;

function worldOf(id: WorldId, alpha: number, hurst: number): World {
  return {
    rate: RATE,
    mean: MEAN,
    sizes: id === "heavy" || id === "both" ? "pareto" : "exponential",
    alpha,
    hurst: id === "clustered" || id === "both" ? hurst : 0.5,
    clustering: 0.5,
  };
}

export function RuinFigure() {
  const [which, setWhich] = useState<WorldId>("classical");
  const [capital, setCapital] = useState(15);
  const [loading, setLoading] = useState(0.2);
  const [alpha, setAlpha] = useState(1.3);
  const [hurst, setHurst] = useState(0.85);
  const [retention, setRetention] = useState(Infinity);
  const [seed, setSeed] = useState(1);
  const [result, setResult] = useState<ReturnType<typeof trial> | null>(null);

  const world = useMemo(() => worldOf(which, alpha, hurst), [which, alpha, hurst]);
  const terms: Terms = useMemo(() => ({ capital, loading, years: YEARS }), [capital, loading]);
  const cover: Cover = useMemo(() => ({ retention, loading: 0.3 }), [retention]);
  const cededCost = RATE * expectedCeded(world, retention) * 1.3;
  const premium = RATE * MEAN * (1 + loading);

  const run = () => {
    setResult(trial(world, terms, cover, RUNS, seed));
    setSeed((s) => s + 1);
  };

  const pathBox = useMemo<Box>(() => {
    const top = result ? Math.max(capital * 2, ...result.sample.flatMap((p) => p.years.map((y) => y.surplus))) : capital * 2;
    const bottom = result ? Math.min(-capital * 0.5, ...result.sample.flatMap((p) => p.years.map((y) => y.surplus))) : -capital * 0.5;
    return { x0: 0, x1: YEARS, y0: Math.max(bottom, -capital * 3), y1: Math.min(top, capital * 6) };
  }, [result, capital]);

  const histogram = useMemo(() => {
    if (!result) return null;
    const totals = result.totals;
    const cap = premium * 3;
    const bins = 40;
    const counts = new Array(bins).fill(0);
    let over = 0;
    for (const t of totals) {
      if (t >= cap) over += 1;
      else counts[Math.floor((t / cap) * bins)] += 1;
    }
    return { counts, over, cap, bins, most: Math.max(1, ...counts) };
  }, [result, premium]);

  return (
    <Panel label="The reader's experiment: a thousand insurers" tone="primary">
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Choices options={WORLD_OPTIONS} value={which} onPick={(id) => { setWhich(id); setResult(null); }} />
          <Field label="Capital" min={2} max={60} step={1} value={capital} format={(v) => `${v} × mean claim`} onChange={(v) => { setCapital(v); setResult(null); }} />
          <Field label="Premium margin" min={0.05} max={0.6} step={0.05} value={loading} format={(v) => `${Math.round(v * 100)} % over expected claims`} onChange={(v) => { setLoading(v); setResult(null); }} />
          {which === "heavy" || which === "both" ? (
            <Field label="Tail index" min={1.1} max={3} step={0.05} value={alpha} format={(v) => `alpha ${v.toFixed(2)}`} onChange={(v) => { setAlpha(v); setResult(null); }} />
          ) : null}
          {which === "clustered" || which === "both" ? (
            <Field label="Memory" min={0.5} max={0.95} step={0.05} value={hurst} format={(v) => `H ${v.toFixed(2)}`} onChange={(v) => { setHurst(v); setResult(null); }} />
          ) : null}
          <Field
            label="Reinsurance"
            min={1}
            max={41}
            step={1}
            value={Number.isFinite(retention) ? retention : 41}
            format={(v) => (v >= 41 ? "none bought" : `pays above ${v} × mean claim`)}
            onChange={(v) => { setRetention(v >= 41 ? Infinity : v); setResult(null); }}
          />
          <Text kind="note" as="p">
            Every insurer starts with the same capital, charges the same premium, {premium.toFixed(1)} a year against expected
            claims of {(RATE * MEAN).toFixed(0)}, and lives {YEARS} years. {Number.isFinite(retention) ? `The reinsurance costs ${cededCost.toFixed(2)} a year, taken out of the premium.` : "No reinsurance is bought."}
          </Text>
          <Button onClick={run}>Run a thousand insurers</Button>
        </div>
        <div className="space-y-3">
          <Figure>
            <Frame className="relative h-[280px]">
              <Plot
                className="h-full w-full"
                box={pathBox}
                deps={[result, pathBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line([[0, 0], [YEARS, 0]], TWO, 1.2);
                  if (!result) {
                    pen.line([[0, capital], [YEARS, capital]], MUTED, 1);
                    return;
                  }
                  for (const path of result.sample) {
                    const pts: [number, number][] = [[0, capital]];
                    path.years.forEach((y, i) => pts.push([i + 1, y.surplus]));
                    pen.line(pts, path.ruined ? "rgba(255,107,107,0.75)" : "rgba(127,240,216,0.55)", 1);
                  }
                }}
              />
            </Frame>
            <Caption>Twenty-four of the insurers, year by year. Green: survived. Rose: went below zero at some moment, which is ruin</Caption>
          </Figure>
          <Figure>
            <Frame className="relative h-[160px]">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                deps={[histogram]}
                draw={(pen) => {
                  if (!histogram) return;
                  const { counts, bins, most, over } = histogram;
                  const w = pen.width / (bins + 1);
                  counts.forEach((c, i) => {
                    const h = (c / most) * (pen.height - 6);
                    pen.ctx.fillStyle = ONE;
                    pen.ctx.fillRect(i * w + 1, pen.height - h, w - 2, h);
                  });
                  if (over > 0) {
                    const h = Math.max(2, (over / most) * (pen.height - 6));
                    pen.ctx.fillStyle = TWO;
                    pen.ctx.fillRect(bins * w + 1, pen.height - h, w - 2, h);
                  }
                  const x = (premium / histogram.cap) * pen.width;
                  pen.ctx.strokeStyle = INK;
                  pen.ctx.setLineDash([4, 3]);
                  pen.ctx.beginPath();
                  pen.ctx.moveTo(x, 0);
                  pen.ctx.lineTo(x, pen.height);
                  pen.ctx.stroke();
                  pen.ctx.setLineDash([]);
                }}
              />
            </Frame>
            <Caption>What one year cost, over every insurer and year. Dashed line: the premium taken in. Rose bar at the right: years costing more than three premiums</Caption>
          </Figure>
          <Verdict good={result ? result.ruinRate < 0.05 : undefined}>
            {!result
              ? "Nothing has run yet. Choose a world and press the button."
              : `${Math.round(result.ruinRate * RUNS)} of ${RUNS} insurers were ruined within ${YEARS} years, ${(result.ruinRate * 100).toFixed(1)} per cent.${which === "classical" && !Number.isFinite(retention) ? ` The classical formula for ruin over an unlimited horizon gives ${(lundbergRuin(world, terms) * 100).toFixed(1)} per cent, so with these numbers the thirty years see most of the ruin there will ever be.` : ""} On average the single largest claim an insurer paid was ${(result.largestClaimShare * 100).toFixed(1)} per cent of everything it paid in thirty years.`}
          </Verdict>
          {result ? (
            <Readout
              rows={[
                ["World", WORLDS.find((w) => w.id === which)?.label ?? ""],
                ["Ruined by year 10, 20, 30", `${(result.byYear[9] * 100).toFixed(1)} %, ${(result.byYear[19] * 100).toFixed(1)} %, ${(result.byYear[29] * 100).toFixed(1)} %`],
                ["Largest claim's share of all paid, average", `${(result.largestClaimShare * 100).toFixed(1)} %`],
                ["Reinsurance", Number.isFinite(retention) ? `above ${retention}, costing ${cededCost.toFixed(2)} a year` : "none"],
              ]}
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{RUNS} runs</Badge>
            <Badge variant="outline">{YEARS} years each</Badge>
            <Badge variant="outline">{RATE} expected claims a year</Badge>
          </div>
        </div>
      </div>
    </Panel>
  );
}
