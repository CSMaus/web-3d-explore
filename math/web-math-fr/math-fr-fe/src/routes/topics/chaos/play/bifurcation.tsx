import { createFileRoute } from "@tanstack/react-router";
import { Label, Button, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
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
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/chaos";
import { INK, MUTED, plate, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { crossing, localMax, lorenz, orbitDiagram, rossler } from "@/systems/flow";
import { SEED, bifurcation, cascade, cobweb, exponent, logistic, logisticSlope, period, sine, sineSlope, type Family } from "@/systems/maps";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/chaos/play/bifurcation")({
  loader: () => api.system(TOPIC, "bifurcation"),
  component: BifurcationPage,
});

const DELTA = 4.669201609;
const FAMILY: Record<string, { label: string; family: Family; slope: (r: number) => (x: number) => number; full: [number, number]; tex: string }> = {
  logistic: { label: "r x (1 - x)", family: logistic, slope: logisticSlope, full: [1.9, 4.0], tex: "x_{n+1} = r x_n (1 - x_n)" },
  sine: { label: "r sin(pi x)", family: sine, slope: sineSlope, full: [0.4, 1.0], tex: "x_{n+1} = r \\sin(\\pi x_n)" },
};
// the same diagram for the two flows the reader has already run: one knob turned, the rest held
// at the values their pages open with, and one number read off each pass of the attractor
const FLOWS = {
  lorenz: { label: L("Lorenz system"), knob: "rho", range: [0.5, 60] as [number, number], columns: 300, reads: L("the value of z at each of its peaks"), held: "sigma = 10, beta = 8/3", page: "Lorenz" },
  rossler: { label: L("Rossler system"), knob: "c", range: [2, 18] as [number, number], columns: 320, reads: L("the value of x each time y passes upward through 0"), held: "a = 0.2, b = 0.2", page: "Rossler" },
};
type FlowName = keyof typeof FLOWS;
// one row of four: the two maps, then the two flows. picking one changes what the diagram is of
const NAMES = [
  { id: "logistic", label: L("Logistic map: x becomes r x (1 - x)") },
  { id: "sine", label: L("Sine map: x becomes r sin(pi x)") },
  { id: "lorenz", label: L("Lorenz system, turning rho") },
  { id: "rossler", label: L("Rossler system, turning c") },
];
const isFlow = (id: string): id is FlowName => id === "lorenz" || id === "rossler";
function flowDiagram(name: FlowName) {
  const f = FLOWS[name];
  return name === "lorenz"
    ? orbitDiagram((rho) => lorenz(10, rho, 8 / 3), f.range[0], f.range[1], f.columns, [1, 1, 1], 0.01, 3000, 6000, localMax(2))
    : orbitDiagram((c) => rossler(0.2, 0.2, c), f.range[0], f.range[1], f.columns, [1, 1, 1], 0.01, 4000, 8000, crossing(1, 0, 0));
}

function BifurcationPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);

  const [name, setName] = useState("logistic");
  const flowName: FlowName | null = isFlow(name) ? name : null;
  // the map behind the map panels: the last map chosen stays when a flow is on show
  const spec = FAMILY[flowName ? "logistic" : name];
  const [from, setFrom] = useState(spec.full[0]);
  const [to, setTo] = useState(spec.full[1]);
  const [columns, setColumns] = useState(900);
  const [keep, setKeep] = useState(140);
  const [withExponent, setWithExponent] = useState(true);
  const [picked, setPicked] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(0);
  const [perFrame, setPerFrame] = useState(6);

  const total = flowName ? FLOWS[flowName].columns : columns;
  const runner = useRunner((n) => setDrawn(n), { perFrame, stopAt: total });
  const shown = Math.min(drawn, total);

  const diagram = useMemo(() => bifurcation(spec.family, from, to, columns, keep, 1200), [spec, from, to, columns, keep]);
  // the period the orbit settles on at each column, and the places it changes
  const periods = useMemo(() => diagram.map((col) => period(col.values, 1e-4)), [diagram]);
  const doublings = useMemo(() => {
    const out: { r: number; from: number; to: number }[] = [];
    for (let i = 1; i < periods.length; i++) {
      if (periods[i] > periods[i - 1] && periods[i - 1] > 0 && periods[i] === 2 * periods[i - 1]) out.push({ r: diagram[i].r, from: periods[i - 1], to: periods[i] });
    }
    return out;
  }, [periods, diagram]);
  const curve = useMemo(() => {
    if (!withExponent) return [];
    const pts: [number, number][] = [];
    const n = Math.min(columns, 420);
    for (let i = 0; i < n; i++) {
      const r = from + ((to - from) * i) / (n - 1);
      pts.push([r, exponent(spec.family, spec.slope, r, 2500, 1500)]);
    }
    return pts;
  }, [spec, from, to, columns, withExponent]);
  const found = useMemo(() => cascade(spec.family, 7, spec.full[0], spec.full[1], 0.5), [spec]);
  const reach = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const col of diagram) for (const v of col.values) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    return Number.isFinite(lo) ? { lo, hi } : { lo: 0, hi: 1 };
  }, [diagram]);
  const pad = (reach.hi - reach.lo) * 0.04 || 0.02;
  // a flow's diagram, computed once, revealed by the run column by column like the map's
  const flow = flowName ? FLOWS[flowName] : null;
  const sweep = useMemo(() => (flowName ? flowDiagram(flowName) : []), [flowName]);
  const sweepBox = useMemo<Box>(() => {
    if (!flow) return { x0: 0, x1: 1, y0: 0, y1: 1 };
    const all = sweep.flatMap((c) => c.values);
    const lo = all.length ? Math.min(...all) : 0;
    const hi = all.length ? Math.max(...all) : 1;
    const gap = (hi - lo) * 0.06 || 1;
    return { x0: flow.range[0], x1: flow.range[1], y0: flowName === "lorenz" ? 0 : lo - gap, y1: hi + gap };
  }, [sweep, flow, flowName]);
  const knobNow = flow && shown > 0 ? sweep[shown - 1].p : flow ? flow.range[0] : 0;
  // the clicked column of the flow's diagram: what the number visits there, one dot a pass
  const [knobPick, setKnobPick] = useState<number | null>(null);
  const knobCol = useMemo(() => {
    if (!sweep.length) return null;
    const want = knobPick ?? knobNow;
    return sweep.reduce((b, c) => (Math.abs(c.p - want) < Math.abs(b.p - want) ? c : b), sweep[0]);
  }, [sweep, knobPick, knobNow]);
  const knobPeriod = knobCol ? period(Float64Array.from(knobCol.values), Math.max(1e-3, (sweepBox.y1 - sweepBox.y0) * 0.002)) : 0;
  const box: Box = { x0: from, x1: to, y0: reach.lo - pad, y1: reach.hi + pad };
  const lyapBox: Box = { x0: from, x1: to, y0: -2.2, y1: 1.0 };
  const accent = palette.roles[0] ?? palette.ink;
  const second = palette.roles[2] ?? palette.ink;

  const rNow = shown > 0 ? diagram[shown - 1].r : from;
  const periodNow = shown > 0 ? periods[shown - 1] : 0;
  // the main cascade ends at the accumulation point; doublings past it happen inside periodic windows
  const edge = found.points.length ? found.points[found.points.length - 1] + 0.002 : to;
  const passed = doublings.filter((d) => d.r <= rNow && d.r <= edge);
  const inWindows = doublings.filter((d) => d.r <= rNow && d.r > edge);
  const rPick = picked ?? rNow;
  const pickCol = useMemo(() => diagram.reduce((b, c, i) => (Math.abs(c.r - rPick) < Math.abs(diagram[b].r - rPick) ? i : b), 0), [diagram, rPick]);
  const web = useMemo(() => cobweb(spec.family(diagram[pickCol].r), SEED, 60), [spec, diagram, pickCol]);
  const lambdaNow = shown > 0 ? exponent(spec.family, spec.slope, rNow, 2500, 1500) : null;
  const lambdaPick = exponent(spec.family, spec.slope, diagram[pickCol].r, 2500, 1500);
  const reset = () => {
    runner.reset();
    setDrawn(0);
  };

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("The bifurcation diagram")}
        job={L("What happens to a repeated rule when one of its numbers is turned up slowly? The rule takes a number x between 0 and 1 and gives the next one: x becomes r x (1 - x). Here r is a fixed number, from about 2 to 4. Applied again and again, the rule makes x do one of three things. It settles on one value. Or it jumps in turn between 2, 4, 8 or more values: this is called a cycle. Or it never repeats at all: this is called chaos. The picture is a bifurcation diagram (bifurcation means splitting in two). Along the bottom is r. Above each r are the values x keeps visiting once its first 1200 steps are thrown away. Pressing run draws the columns from left to right, one value of r at a time. What to look for: at r = 3 the single line splits into two, then into four, then eight, faster and faster. Near r = 3.57 the lines turn into a band of scattered dots. Each split is called a doubling.")}
        input={
          <div className="space-y-3">
            <Choices options={NAMES} value={name} onPick={(id) => { setName(id); if (!isFlow(id)) { setFrom(FAMILY[id].full[0]); setTo(FAMILY[id].full[1]); } setPicked(null); setKnobPick(null); reset(); }} />
            <Text kind="note" as="p">
              {L("The four buttons choose the rule behind the diagram. The first two turn one number into the next: x becomes r x (1 - x), or x becomes r sin(pi x), a hump of a similar shape. For them the number turned up is r. The other two are the Lorenz and Rossler systems. Each describes a point moving in space. Its position is three numbers x, y and z, and three equations say how fast each of them changes. The point keeps coming round in loops. For these two, one number in the equations is turned up and the others stay fixed. Above each of its values, the diagram puts one dot for each loop.")}
            </Text>
            {flow ? (
              <Text kind="note" as="p">
                {L("{{label}}: the number turned up, {{knob}}, runs from {{from}} to {{to}}, while {{held}} stay fixed. Each dot is {{reads}}. Clicking a column of the diagram shows its values one after another in the picture below it.", { label: flow.label, knob: flow.knob, from: flow.range[0], to: flow.range[1], held: flow.held, reads: flow.reads })}
              </Text>
            ) : null}
            {!flow ? (<>
            <Slider label={L("Smallest r shown")} min={spec.full[0]} max={spec.full[1]} step={0.0005} value={from} format={(v) => v.toFixed(4)} onChange={(v) => { setFrom(Math.min(v, to - 0.001)); reset(); }} />
            <Slider label={L("Largest r shown")} min={spec.full[0]} max={spec.full[1]} step={0.0005} value={to} format={(v) => v.toFixed(4)} onChange={(v) => { setTo(Math.max(v, from + 0.001)); reset(); }} />
            <Slider label={L("Columns: how many values of r")} min={200} max={1600} step={50} value={columns} format={(v) => String(Math.round(v))} onChange={(v) => { setColumns(Math.round(v)); reset(); }} />
            <Slider label={L("Dots in each column")} min={40} max={400} step={10} value={keep} format={(v) => String(Math.round(v))} onChange={(v) => { setKeep(Math.round(v)); reset(); }} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setWithExponent((v) => !v)} aria-pressed={withExponent}>
                {L("Show or hide the Lyapunov exponent")}
              </Button>
              {found.points.length > 3 ? (
                <Button variant="outline" size="sm" type="button" onClick={() => { const last = found.points[found.points.length - 1]; setFrom(found.points[2]); setTo(last + (last - found.points[2]) * 0.08); reset(); }}>
                  {L("Zoom in on the doublings")}
                </Button>
              ) : null}
              <Button variant="outline" size="sm" type="button" onClick={() => { setFrom(spec.full[0]); setTo(spec.full[1]); reset(); }}>
                {L("Show the full range of r")}
              </Button>
            </div>
            <Text kind="note" as="p">
              {L("Clicking a column of the diagram picks that value of r. The lowest picture then shows its cobweb: the steps of the rule drawn as a staircase. The two sliders above set which part of r is shown.")}
            </Text>
            </>) : null}
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={shown}
            what={flow ? L("columns, {{knob}} = {{value}}", { knob: flow.knob, value: knobNow.toFixed(2) }) : L("columns, {{knob}} = {{value}}", { knob: "r", value: rNow.toFixed(4) })}
            limit={total}
            onToggle={() => {
              if (!runner.running && shown >= total) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        more={flow ? null : (
          <section data-slot="panel">
            <Label>{L("WHERE THE DOUBLINGS HAPPEN")}</Label>
            <div data-text="caption" className="mt-2">
              <div className="flex text-muted-foreground">
                <span className="w-12">{L("Cycle")}</span>
                <span className="w-24">{L("At r")}</span>
                <span className="w-20">{L("Gap")}</span>
                <span>{L("Gap ratio")}</span>
              </div>
              {found.points.map((p, i) => (
                <div key={i} className="flex">
                  <span className="w-12 text-muted-foreground">{Math.pow(2, i)}</span>
                  <span className="w-24 text-foreground/80">{p.toFixed(6)}</span>
                  <span className="w-20 text-muted-foreground">{i ? found.gaps[i - 1].toFixed(6) : "-"}</span>
                  <span style={{ color: i >= 2 ? accent : undefined }} className={i >= 2 ? "" : "text-muted-foreground"}>{i >= 2 ? found.ratios[i - 2].toFixed(4) : "-"}</span>
                </div>
              ))}
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("Each row is one cycle length: 1, 2, 4, 8 and so on. Its r is the value at which x = 0.5, the top of the hump, comes back to itself after exactly that many steps. The page finds that r by halving an interval again and again until it is pinned down. The gap is the distance from the r of the row above. The gap ratio is the gap of the row above divided by this one. The ratios approach {{delta}}, a number called Feigenbaum's constant. The sine rule gives the same number.", { delta: DELTA.toFixed(6) })}
            </Text>
          </section>
        )}
        picture={flow ? (
          <section ref={stage} className="space-y-2">
            <div><div data-slot="plot" className="h-[min(320px,calc(100vh-34rem))] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={sweepBox}
                deps={[sweep, shown, palette, sweepBox, knobCol]}
                onPick={(x) => setKnobPick(Math.max(sweepBox.x0, Math.min(sweepBox.x1, x)))}
                draw={(pen) => {
                  ticks(pen);
                  const { ctx } = pen;
                  ctx.fillStyle = accent;
                  ctx.globalAlpha = 0.55;
                  for (let i = 0; i < shown; i++) {
                    const col = sweep[i];
                    const px = pen.px(col.p);
                    for (const v of col.values) ctx.fillRect(px, pen.py(v), 1, 1);
                  }
                  ctx.globalAlpha = 1;
                  if (shown > 0 && shown < sweep.length) pen.line([[knobNow, sweepBox.y0], [knobNow, sweepBox.y1]], INK, 1);
                  if (knobCol && knobPick !== null) pen.line([[knobCol.p, sweepBox.y0], [knobCol.p, sweepBox.y1]], second, 1);
                }}
              />
            </div><Caption>{L("{{label}}, with {{held}} fixed. Along the bottom: {{knob}}, the number being turned up. Above each value: {{reads}}, after the start of the motion is thrown away. One dot means the same value on every loop. A few dots mean a cycle that repeats after a few loops. A band of scattered dots means chaos: the motion never repeats. Inside the band there are gaps where a cycle comes back for a while. Clicking a column shows its values below.", { label: flow.label, held: flow.held, knob: flow.knob, reads: flow.reads })}</Caption></div>
            <div><div data-slot="plot" className="h-[170px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: Math.max(10, knobCol?.values.length ?? 10), y0: sweepBox.y0, y1: sweepBox.y1 }}
                deps={[knobCol, palette, sweepBox]}
                draw={(pen) => {
                  ticks(pen);
                  if (!knobCol) return;
                  pen.line(knobCol.values.map((v, i) => [i, v] as [number, number]), "#3a4048", 1);
                  knobCol.values.forEach((v, i) => pen.dot(i, v, 1.8, second));
                }}
              />
            </div><Caption>{knobCol ? `${L("At {{knob}} = {{value}}: {{reads}}, loop after loop. Along the bottom: the loop count, {{n}} loops in all.", { knob: flow.knob, value: knobCol.p.toFixed(2), reads: flow.reads, n: knobCol.values.length })} ${knobPeriod === 1 ? L("The same value on every loop: the motion repeats after one loop, and the dots form one line.") : knobPeriod > 1 ? L("The same {{k}} values come round in turn: the motion repeats after {{k}} loops.", { k: knobPeriod }) : L("No value repeats within 64 loops: the motion is chaotic.")}` : L("Clicking a column in the picture above shows its values here.")}</Caption></div>
          </section>
        ) : (
          <section ref={stage} className="space-y-2">
            <div><div data-slot="plot" className="h-[min(300px,calc(100vh-34rem))] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={box}
                deps={[diagram, shown, palette, box, rPick]}
                onPick={(x) => setPicked(Math.max(from, Math.min(to, x)))}
                draw={(pen) => {
                  ticks(pen);
                  const { ctx } = pen;
                  ctx.fillStyle = accent;
                  ctx.globalAlpha = 0.5;
                  for (let i = 0; i < shown; i++) {
                    const col = diagram[i];
                    const px = pen.px(col.r);
                    for (const v of col.values) ctx.fillRect(px, pen.py(v), 1, 1);
                  }
                  ctx.globalAlpha = 1;
                  doublings.forEach((d, i) => {
                    if (d.r > rNow) return;
                    pen.line([[d.r, reach.lo - pad], [d.r, reach.hi + pad]], "#2c3540", 1);
                    // the labels stagger so the crowded ones do not sit on each other
                    if (d.r <= edge && d.to <= 8) plate(pen, L("{{from}} to {{to}}", { from: d.from, to: d.to }), d.r, reach.hi + pad * 0.2 - (i % 2) * (reach.hi - reach.lo) * 0.06, MUTED, "center");
                  });
                  if (shown > 0 && shown < columns) pen.line([[rNow, reach.lo - pad], [rNow, reach.hi + pad]], INK, 1);
                  if (picked !== null) pen.line([[diagram[pickCol].r, reach.lo - pad], [diagram[pickCol].r, reach.hi + pad]], second, 1);
                }}
              />
            </div><Caption>{L("Along the bottom: r. Above each r: the values x keeps visiting after its first 1200 steps are thrown away. Thin upright lines mark the doublings found, with the number of values before and after. Clicking a column shows its cobweb in the lowest picture.")}</Caption></div>
            {withExponent ? (
              <div><div data-slot="plot" className="h-[170px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={lyapBox}
                  deps={[curve, shown, palette, lyapBox, rPick]}
                  onPick={(x) => setPicked(Math.max(from, Math.min(to, x)))}
                  draw={(pen) => {
                    ticks(pen);
                    pen.line([[from, 0], [to, 0]], "#3a4048", 1);
                    pen.line([[from, Math.LN2], [to, Math.LN2]], "#243a2c", 1);
                    plate(pen, L("zero"), from + (to - from) * 0.01, 0.12, MUTED);
                    plate(pen, L("ln 2, the highest, reached at r = 4"), from + (to - from) * 0.01, Math.LN2 + 0.12, MUTED);
                    // the curve, clipped to the panel: the dips at superstable cycles run to minus infinity
                    const seen = curve.filter((p) => p[0] <= rNow || shown >= columns).map(([r, v]) => [r, Math.max(lyapBox.y0 + 0.05, v)] as [number, number]);
                    pen.line(seen, second, 1.4);
                    for (const [r, v] of seen) if (v > 0) pen.dot(r, v, 1.2, second);
                    if (picked !== null) pen.line([[diagram[pickCol].r, lyapBox.y0], [diagram[pickCol].r, lyapBox.y1]], INK, 1);
                  }}
                />
              </div><Caption>{L("The Lyapunov exponent for each r. It measures how fast two starts that differ very slightly move apart. At each step their distance is multiplied, on average, by e (about 2.718) to the power of this exponent. Below zero the starts come together, and x settles on a cycle. At zero a doubling happens. Above zero the starts move apart, and x never settles: this is chaos. A dip inside the part above zero is a window where a cycle returns. A dip down to the bottom edge marks an r where the cycle is as stable as it can be.")}</Caption></div>
            ) : null}
            <div><div data-slot="plot" className="h-[170px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={{ x0: -0.02, x1: 1.02, y0: -0.02, y1: 1.02 }}
                equal
                deps={[web, pickCol, palette]}
                draw={(pen) => {
                  ticks(pen);
                  const f = spec.family(diagram[pickCol].r);
                  pen.line([[0, 0], [1, 1]], "#3a4048", 1);
                  const pts: [number, number][] = [];
                  for (let i = 0; i <= 300; i++) pts.push([i / 300, f(i / 300)]);
                  pen.line(pts, second, 1.4);
                  pen.line(web.flatMap((g) => [[g.x0, g.y0], [g.x1, g.y1]] as [number, number][]), accent, 0.8);
                  for (const v of diagram[pickCol].values) pen.dot(v, v, 2, INK);

                }}
              />
            </div><Caption>{L("The cobweb at r = {{r}}. The hump is the rule: its height above x is the next x. The straight line from corner to corner is the diagonal, where the next x equals the current x. From the start, a step up or down to the hump gives the next x. A step across to the diagonal makes it the new start. Sixty such steps draw a staircase. Here {{settles}}, and the Lyapunov exponent is {{lambda}}. Dots on the diagonal: the values in that column of the diagram.", { r: diagram[pickCol].r.toFixed(4), settles: periods[pickCol] ? L("x repeats every {{k}} steps", { k: periods[pickCol] }) : L("x does not repeat within 64 steps"), lambda: lambdaPick.toFixed(3) })}</Caption></div>
          </section>
        )}
        result={
          <div className="space-y-2">
            <Verdict>
              {flow
                ? shown === 0
                  ? L("{{label}}: {{knob}} is turned up from {{from}} to {{to}}, in {{columns}} columns. Pressing run builds the diagram from left to right, one value of {{knob}} at a time. Each column is a full computation of the motion for that value.", { label: flow.label, knob: flow.knob, from: flow.range[0], to: flow.range[1], columns: flow.columns })
                  : `${L("{{shown}} of {{columns}} columns drawn, up to {{knob}} = {{value}}.", { shown, columns: flow.columns, knob: flow.knob, value: knobNow.toFixed(2) })} ${knobCol && knobPick === null ? (knobPeriod === 1 ? L("At that value the same number comes back on every loop: the motion repeats after one loop.") : knobPeriod > 1 ? L("At that value the motion repeats after {{k}} loops.", { k: knobPeriod }) : L("At that value the motion never repeats: it is chaotic, and the column is a band of scattered dots.")) : ""}${knobCol && knobPick !== null ? ` ${L("The chosen column is {{knob}} = {{value}}: {{settles}}.", { knob: flow.knob, value: knobCol.p.toFixed(2), settles: knobPeriod === 1 ? L("the motion repeats after one loop") : knobPeriod > 1 ? L("the motion repeats after {{k}} loops", { k: knobPeriod }) : L("the motion never repeats") })}` : ""} ${L("The picture reads as for the one-number rules: one line, a few lines, or a band of scattered dots. Here it comes from three equations for a moving point, not from one line of arithmetic.")}`
                : shown === 0
                ? L("r runs from {{from}} to {{to}}, in {{columns}} columns. Pressing run builds the diagram from left to right, one value of r at a time.", { from: from.toFixed(3), to: to.toFixed(3), columns })
                : `${L("{{shown}} of {{columns}} columns drawn, up to {{knob}} = {{value}}.", { shown, columns, knob: "r", value: rNow.toFixed(4) })} ${periodNow === 1 ? L("At this r, x settles on one value: the diagram is a single line.") : periodNow > 1 ? (passed.length ? L("At this r, x jumps in turn between {{n}} values. The last doubling, from {{from}} to {{to}} values, happened at r = {{r}}.", { n: periodNow, from: passed[passed.length - 1].from, to: passed[passed.length - 1].to, r: passed[passed.length - 1].r.toFixed(4) }) : L("At this r, x jumps in turn between {{n}} values.", { n: periodNow })) : inWindows.length ? L("At this r, x does not repeat within 64 steps: the column is a band of scattered dots, which means chaos. Before this r there were {{n}} doublings, each closer to the next. {{k}} more doublings happened inside windows, short stretches of r where a cycle returns.", { n: passed.length, k: inWindows.length }) : L("At this r, x does not repeat within 64 steps: the column is a band of scattered dots, which means chaos. Before this r there were {{n}} doublings, each closer to the next.", { n: passed.length })}${lambdaNow !== null ? ` ${L("The Lyapunov exponent at this r is {{lambda}}: {{meaning}}.", { lambda: lambdaNow.toFixed(3), meaning: lambdaNow > 0.01 ? L("it is positive, so two starts that differ very slightly move apart, and x never settles") : lambdaNow < -0.01 ? L("it is negative, so two close starts are pulled together onto the same cycle") : L("it is close to zero, which is what the exponent shows at a doubling") })}` : ""}${picked !== null ? ` ${L("The cobweb in the lowest picture is for r = {{r}}.", { r: diagram[pickCol].r.toFixed(4) })}` : ""}`}
            </Verdict>
            <Readout
              rows={flow ? [
                [L("Rule behind the diagram"), L("{{label}}, with {{held}} fixed", { label: flow.label, held: flow.held })],
                [L("Number being turned up"), L("{{knob}}, from {{from}} to {{to}}, in {{columns}} columns", { knob: flow.knob, from: flow.range[0], to: flow.range[1], columns: flow.columns })],
                [L("Value plotted for each loop"), flow.reads],
                [L("Chosen column"), knobCol ? L("{{knob}} = {{value}}, {{n}} loops recorded", { knob: flow.knob, value: knobCol.p.toFixed(3), n: knobCol.values.length }) : "-"],
                [L("What the motion does in the chosen column"), knobCol ? (knobPeriod === 1 ? L("repeats after one loop") : knobPeriod > 1 ? L("the motion repeats after {{k}} loops", { k: knobPeriod }) : L("no repeat within 64 loops: chaos")) : "-"],
                [L("Computation for each column"), flowName === "lorenz" ? L("time steps of 0.01: the first 3,000 thrown away, the next 6,000 used") : L("time steps of 0.01: the first 4,000 thrown away, the next 8,000 used")],
              ] : [
                [L("Rule"), spec.tex.replace(/[\\{}]/g, "")],
                [L("Range of r shown"), L("{{from}} to {{to}}", { from: from.toFixed(5), to: to.toFixed(5) })],
                [L("r of each doubling found so far"), passed.map((d) => `${d.r.toFixed(4)}`).join(", ") || L("None yet")],
                [L("Each gap between doublings divided by the next gap"), passed.length >= 3 ? passed.slice(2).map((d, i) => ((passed[i + 1].r - passed[i].r) / (d.r - passed[i + 1].r)).toFixed(2)).join(", ") : L("Needs three doublings")],
                [L("Lyapunov exponent at the current r"), lambdaNow !== null ? lambdaNow.toFixed(4) : "-"],
                [L("Lyapunov exponent at r = 4, exactly ln 2"), Math.LN2.toFixed(4)],
                [L("Feigenbaum's constant, known value"), DELTA.toFixed(5)],
                [L("Feigenbaum's constant, as measured on this page"), found.ratios.length ? found.ratios[found.ratios.length - 1].toFixed(5) : "-"],
                [L("Difference between the two values"), found.ratios.length ? Math.abs(found.ratios[found.ratios.length - 1] - DELTA).toExponential(1) : "-"],
                [L("r where the doublings pile up, approximately"), found.points.length ? found.points[found.points.length - 1].toFixed(6) : "-"],
                [L("Numbers computed"), L("{{columns}} columns of {{keep}} dots, each after 1200 steps thrown away", { columns, keep })],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("The doublings come closer and closer together. Each gap between two doublings is about 4.669 times longer than the next one. This number, Feigenbaum's constant, does not depend on the rule: the sine rule gives the same. Past the point where the doublings pile up, x does not settle, except in windows where a cycle returns for a while. The Lorenz and Rossler buttons draw the same kind of diagram for a point moving in space.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`chaos-bifurcation-${name}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
