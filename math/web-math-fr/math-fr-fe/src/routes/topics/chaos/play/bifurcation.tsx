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
  lorenz: { label: L("Lorenz system"), knob: "rho", range: [0.5, 60] as [number, number], columns: 300, reads: L("the height of each peak of z"), held: "sigma = 10, beta = 8/3", page: "Lorenz" },
  rossler: { label: L("Rossler system"), knob: "c", range: [2, 18] as [number, number], columns: 320, reads: L("x at each crossing of the plane y = 0"), held: "a = 0.2, b = 0.2", page: "Rossler" },
};
type FlowName = keyof typeof FLOWS;
// one row of four: the two maps, then the two flows. picking one changes what the diagram is of
const NAMES = [
  { id: "logistic", label: L("Logistic map, r x (1 - x)") },
  { id: "sine", label: L("Sine map, r sin(pi x)") },
  { id: "lorenz", label: L("Lorenz system, knob rho") },
  { id: "rossler", label: L("Rossler system, knob c") },
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
        job={L("A bifurcation diagram is a map of everything a system can settle into as one knob is turned: the knob along the bottom, the long-run values above it. It shows at a glance where one answer splits into two, then four, then into chaos, and the same picture appears for many different rules. The last page fixed r and iterated. This one turns r up slowly, one column at a time, and above each value plots only what the number still visits once the approach is thrown away. One value, then two, then four, then a smear. The job is to watch that happen and to find where each doubling lands.")}
        input={
          <div className="space-y-3">
            <Choices options={NAMES} value={name} onPick={(id) => { setName(id); if (!isFlow(id)) { setFrom(FAMILY[id].full[0]); setTo(FAMILY[id].full[1]); } setPicked(null); setKnobPick(null); reset(); }} />
            <Text kind="note" as="p">
              {L("What the diagram is of. The two maps take one number to the next, as on the last page; the knob is r. The two systems are the Lorenz and Rossler pages, with one of their knobs turned and everything else held: above each value of the knob, one dot for each pass of the attractor. The same picture, drawn for four different rules.")}
            </Text>
            {flow ? (
              <Text kind="note" as="p">
                {L("For the {{label}} the knob runs from {{from}} to {{to}} with {{held}} held, and the number read off each pass is {{reads}}. Click any column to see what the attractor visits there.", { label: flow.label, from: flow.range[0], to: flow.range[1], held: flow.held, reads: flow.reads })}
              </Text>
            ) : null}
            {!flow ? (<>
            <Slider label={L("r from")} min={spec.full[0]} max={spec.full[1]} step={0.0005} value={from} format={(v) => v.toFixed(4)} onChange={(v) => { setFrom(Math.min(v, to - 0.001)); reset(); }} />
            <Slider label={L("r to")} min={spec.full[0]} max={spec.full[1]} step={0.0005} value={to} format={(v) => v.toFixed(4)} onChange={(v) => { setTo(Math.max(v, from + 0.001)); reset(); }} />
            <Slider label={L("Columns")} min={200} max={1600} step={50} value={columns} format={(v) => String(Math.round(v))} onChange={(v) => { setColumns(Math.round(v)); reset(); }} />
            <Slider label={L("Points a column")} min={40} max={400} step={10} value={keep} format={(v) => String(Math.round(v))} onChange={(v) => { setKeep(Math.round(v)); reset(); }} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setWithExponent((v) => !v)} aria-pressed={withExponent}>
                {L("Exponent panel")}
              </Button>
              {found.points.length > 3 ? (
                <Button variant="outline" size="sm" type="button" onClick={() => { const last = found.points[found.points.length - 1]; setFrom(found.points[2]); setTo(last + (last - found.points[2]) * 0.08); reset(); }}>
                  {L("Zoom to the cascade")}
                </Button>
              ) : null}
              <Button variant="outline" size="sm" type="button" onClick={() => { setFrom(spec.full[0]); setTo(spec.full[1]); reset(); }}>
                {L("Reset range")}
              </Button>
            </div>
            <Text kind="note" as="p">
              {L("Click any column of the diagram to see that r's cobweb below it. Drag to move the range once it is narrower than the whole.")}
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
            onStep={(many) => setDrawn((v) => Math.min(total, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        more={flow ? null : (
          <section data-slot="panel">
            <Label>{L("THE CASCADE")}</Label>
            <div data-text="caption" className="mt-2">
              <div className="flex text-muted-foreground">
                <span className="w-12">{L("Period")}</span>
                <span className="w-24">{L("Superstable r")}</span>
                <span className="w-20">{L("Gap")}</span>
                <span>{L("Ratio")}</span>
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
              {L("Each r is found by bisection on the condition that the critical point returns to itself after that many steps. The ratio of successive gaps approaches Feigenbaum's constant, {{delta}}, And it is the same number for both families.", { delta: DELTA.toFixed(6) })}
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
            </div><Caption>{L("The {{label}}, {{held}} held. Along the bottom: {{knob}}. Above each value: {{reads}}, after the approach is thrown away. One dot is a steady state, a few a cycle, a smear the attractor, with windows in it where a cycle comes back. Click a column to look at it.", { label: flow.label, held: flow.held, knob: flow.knob, reads: flow.reads })}</Caption></div>
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
            </div><Caption>{knobCol ? `${L("At {{knob}} = {{value}}: {{reads}}, pass after pass, {{n}} passes along the bottom.", { knob: flow.knob, value: knobCol.p.toFixed(2), reads: flow.reads, n: knobCol.values.length })} ${knobPeriod === 1 ? L("The same value every pass: a steady rhythm, one line.") : knobPeriod > 1 ? L("The same {{k}} values in turn: a cycle of {{k}}.", { k: knobPeriod }) : L("No repeat within 64 passes: the attractor.")}` : L("Click a column above.")}</Caption></div>
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
            </div><Caption>{L("Above each r: what the number still visits after 1200 steps. Click a column for its cobweb.")}</Caption></div>
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
                    plate(pen, L("ln 2, the most at r = 4"), from + (to - from) * 0.01, Math.LN2 + 0.12, MUTED);
                    // the curve, clipped to the panel: the dips at superstable cycles run to minus infinity
                    const seen = curve.filter((p) => p[0] <= rNow || shown >= columns).map(([r, v]) => [r, Math.max(lyapBox.y0 + 0.05, v)] as [number, number]);
                    pen.line(seen, second, 1.4);
                    for (const [r, v] of seen) if (v > 0) pen.dot(r, v, 1.2, second);
                    if (picked !== null) pen.line([[diagram[pickCol].r, lyapBox.y0], [diagram[pickCol].r, lyapBox.y1]], INK, 1);
                  }}
                />
              </div><Caption>{L("The exponent along r. Below zero: a cycle. Zero: a doubling. Above: the smear. A dip in the smear is a periodic window; to the floor, a superstable cycle.")}</Caption></div>
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
            </div><Caption>{L("The cobweb at r = {{r}}: {{settles}}, exponent {{lambda}}. White dots: the values in that column", { r: diagram[pickCol].r.toFixed(4), settles: periods[pickCol] ? L("a cycle of {{k}}", { k: periods[pickCol] }) : L("no cycle within 64"), lambda: lambdaPick.toFixed(3) })}</Caption></div>
          </section>
        )}
        result={
          <div className="space-y-2">
            <Verdict>
              {flow
                ? shown === 0
                  ? L("The {{label}}, with {{knob}} turned from {{from}} to {{to}} in {{columns}} columns. Press run and the diagram is built left to right, one value of {{knob}} at a time, each column a full run of the system.", { label: flow.label, knob: flow.knob, from: flow.range[0], to: flow.range[1], columns: flow.columns })
                  : `${L("{{shown}} of {{columns}} columns, up to {{knob}} = {{value}}.", { shown, columns: flow.columns, knob: flow.knob, value: knobNow.toFixed(2) })} ${knobCol && knobPick === null ? (knobPeriod === 1 ? L("There the system settles on one value: a steady rhythm.") : knobPeriod > 1 ? L("There the system repeats every {{k}} passes: a cycle of {{k}}.", { k: knobPeriod }) : L("There the system never repeats: the attractor, the smear.")) : ""}${knobCol && knobPick !== null ? ` ${L("The column looked at is {{knob}} = {{value}}: {{settles}}.", { knob: flow.knob, value: knobCol.p.toFixed(2), settles: knobPeriod === 1 ? L("a steady rhythm") : knobPeriod > 1 ? L("a cycle of {{k}}", { k: knobPeriod }) : L("the attractor") })}` : ""} ${L("The same doublings and the same windows as the maps, read off three differential equations instead of one line of arithmetic.")}`
                : shown === 0
                ? L("r runs from {{from}} to {{to}} in {{columns}} columns. Press run and the diagram is built left to right, one r at a time.", { from: from.toFixed(3), to: to.toFixed(3), columns })
                : `${L("{{shown}} of {{columns}} columns, up to {{knob}} = {{value}}.", { shown, columns, knob: "r", value: rNow.toFixed(4) })} ${periodNow === 1 ? L("The number settles on one value: a single line.") : periodNow > 1 ? (passed.length ? L("The number settles on {{n}} values; the last doubling, {{from}} to {{to}}, landed at r = {{r}}.", { n: periodNow, from: passed[passed.length - 1].from, to: passed[passed.length - 1].to, r: passed[passed.length - 1].r.toFixed(4) }) : L("The number settles on {{n}} values.", { n: periodNow })) : inWindows.length ? L("The number settles on nothing within 64 steps: the smear. {{n}} doublings came before it, closer and closer together, and {{k}} more inside the periodic windows within the smear.", { n: passed.length, k: inWindows.length }) : L("The number settles on nothing within 64 steps: the smear. {{n}} doublings came before it, closer and closer together.", { n: passed.length })}${lambdaNow !== null ? ` ${L("The exponent there is {{lambda}}: {{meaning}}.", { lambda: lambdaNow.toFixed(3), meaning: lambdaNow > 0.01 ? L("positive, so two nearby starts drift apart and the number never settles") : lambdaNow < -0.01 ? L("negative, so nearby starts are pulled together onto the cycle") : L("about zero, which is what a doubling looks like from the exponent's side") })}` : ""}${picked !== null ? ` ${L("The cobweb below is r = {{r}}.", { r: diagram[pickCol].r.toFixed(4) })}` : ""}`}
            </Verdict>
            <Readout
              rows={flow ? [
                [L("System"), L("{{label}}, {{held}} held", { label: flow.label, held: flow.held })],
                [L("Knob"), L("{{knob}}, {{from}} to {{to}} in {{columns}} columns", { knob: flow.knob, from: flow.range[0], to: flow.range[1], columns: flow.columns })],
                [L("Read off each pass"), flow.reads],
                [L("Column looked at"), knobCol ? L("{{knob}} = {{value}}, {{n}} passes kept", { knob: flow.knob, value: knobCol.p.toFixed(3), n: knobCol.values.length }) : "-"],
                [L("What it settles on there"), knobCol ? (knobPeriod === 1 ? L("one value") : knobPeriod > 1 ? L("a cycle of {{k}}", { k: knobPeriod }) : L("no repeat within 64: the attractor")) : "-"],
                [L("Steps a column"), flowName === "lorenz" ? L("3,000 discarded, 6,000 kept, at dt = 0.01") : L("4,000 discarded, 8,000 kept, at dt = 0.01")],
              ] : [
                [L("Family"), spec.tex.replace(/[\\{}]/g, "")],
                [L("Range shown"), L("{{from}} to {{to}}", { from: from.toFixed(5), to: to.toFixed(5) })],
                [L("Doublings found so far"), passed.map((d) => `${d.r.toFixed(4)}`).join(", ") || L("None yet")],
                [L("Gaps between them, each over the next"), passed.length >= 3 ? passed.slice(2).map((d, i) => ((passed[i + 1].r - passed[i].r) / (d.r - passed[i + 1].r)).toFixed(2)).join(", ") : L("Needs three")],
                [L("Exponent at the current r"), lambdaNow !== null ? lambdaNow.toFixed(4) : "-"],
                [L("Exponent at r = 4, exactly ln 2"), Math.LN2.toFixed(4)],
                [L("Feigenbaum's delta"), DELTA.toFixed(5)],
                [L("Delta from the located cascade"), found.ratios.length ? found.ratios[found.ratios.length - 1].toFixed(5) : "-"],
                [L("Off by"), found.ratios.length ? Math.abs(found.ratios[found.ratios.length - 1] - DELTA).toExponential(1) : "-"],
                [L("Cascade accumulates near"), found.points.length ? found.points[found.points.length - 1].toFixed(6) : "-"],
                [L("Orbits computed"), L("{{columns}} columns of {{keep}} points, after 1200 discarded", { columns, keep })],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("The doublings crowd together: each gap is about 4.669 times shorter than the one before, and that number does not depend on the rule. Switch to the sine family and it is the same. Past the accumulation point the number settles on nothing, except in windows where a cycle returns for a while. Pick the Lorenz or Rossler system above and the same picture is drawn for a flow: the route into chaos does not care what the system is.")}
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
