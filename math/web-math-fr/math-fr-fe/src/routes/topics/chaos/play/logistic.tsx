import { createFileRoute } from "@tanstack/react-router";
import { Swatch, Text } from "@kit/index";
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
import { FAINT, INK, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { SEED, cobweb, compose, exponent, logistic, logisticSlope, orbit, period } from "@/systems/maps";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/chaos/play/logistic")({
  loader: () => api.system(TOPIC, "logistic"),
  component: LogisticPage,
});

const UNIT: Box = { x0: -0.02, x1: 1.02, y0: -0.02, y1: 1.02 };
const MOST = 120;
const TWIN = 1e-6;
const PRESETS = [
  { id: "2.8", label: L("r = 2.8: settles on one value") },
  { id: "3.2", label: L("r = 3.2: two values in turn") },
  { id: "3.5", label: L("r = 3.5: four values in turn") },
  { id: "3.56995", label: L("r = 3.56995: where the doubling ends") },
  { id: "3.7", label: L("r = 3.7: chaos") },
  { id: "3.83", label: L("r = 3.83: a cycle inside the chaos") },
  { id: "4", label: L("r = 4: chaos across the whole range") },
];

function LogisticPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);

  const [r, setR] = useState(2.8);
  const [x0, setX0] = useState(0.2);
  const [iterate, setIterate] = useState(1);
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(0.15);

  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: MOST });
  const n = Math.min(shown, MOST);

  const m = useMemo(() => logistic(r), [r]);
  const composed = useMemo(() => compose(m, iterate), [m, iterate]);
  const rungs = useMemo(() => cobweb(composed, x0, n), [composed, x0, n]);
  const series = useMemo(() => orbit(m, x0, MOST + 1), [m, x0]);
  const twin = useMemo(() => orbit(m, Math.min(0.99, x0 + TWIN), MOST + 1), [m, x0]);
  const settled = useMemo(() => orbit(m, SEED, 400, 6000), [m]);
  const cycle = useMemo(() => period(settled), [settled]);
  const lambda = useMemo(() => exponent(logistic, logisticSlope, r), [r]);
  const fixed = r > 1 ? 1 - 1 / r : 0;
  const xNow = series[n];
  const gapNow = Math.abs(series[n] - twin[n]);
  const levels = useMemo(() => (cycle ? Array.from(settled.subarray(0, cycle)).sort((a, b) => a - b) : []), [cycle, settled]);
  const nearest = levels.length ? levels.reduce((b, v) => (Math.abs(v - xNow) < Math.abs(b - xNow) ? v : b), levels[0]) : null;

  const accent = palette.roles[0] ?? palette.ink;
  const curve = palette.roles[2] ?? palette.ink;
  const reset = () => {
    runner.reset();
    setShown(0);
  };
  const seriesBox: Box = { x0: -1, x1: MOST + 1, y0: -0.02, y1: 1.02 };
  const preset = PRESETS.find((p) => Number(p.id) === r)?.id ?? "";

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("The logistic map")}
        job={L("Where does a number end up if the same simple rule is applied to it again and again? The rule: take a number x between 0 and 1, multiply it by r and by 1 - x, and the result is the next number. As a formula: x becomes r x (1 - x). For example, with r = 2.8 and x = 0.2 the next number is 2.8 × 0.2 × 0.8 = 0.448. This rule is called the logistic map. It is the simplest model of a population of animals. x is the population as a share of the most the place can feed. r is how fast the population grows when there is plenty of room. 1 - x is the room that is left, so a crowded population grows less. Depending on r, the number settles on one value, or keeps jumping between a few values in a fixed order, or never settles at all. The left picture shows each step as a drawing: from the current number go up or down to the curve, then across to the diagonal line, and repeat. The right picture shows the same numbers in order, one per step.")}
        input={
          <div className="space-y-3">
            <Choices options={PRESETS} value={preset} onPick={(id) => { setR(Number(id)); reset(); }} />
            <Slider label={L("r: how fast the population grows when there is room")} min={0.5} max={4} step={0.001} value={r} format={(v) => v.toFixed(3)} onChange={(v) => { setR(v); reset(); }} />
            <Slider label={L("Start x0: the first number")} min={0.01} max={0.99} step={0.005} value={x0} format={(v) => v.toFixed(3)} onChange={(v) => { setX0(v); reset(); }} />
            <Slider label={L("Times the rule is applied in one step (left picture)")} min={1} max={8} step={1} value={iterate} format={(v) => String(Math.round(v))} onChange={(v) => { setIterate(Math.round(v)); reset(); }} />
            <Text kind="note" as="p">
              {L("A click on the left picture chooses the start x0. The slider for times per step redraws the left curve as the rule applied two or more times in a row. Two values that the rule swaps back and forth become, under the rule applied twice, two values that stay where they are: the curve crosses the diagonal there. On the right, a second start one millionth higher than the first is drawn as a dashed line next to the first.")}
            </Text>
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            what={L("steps")}
            limit={MOST}
            onToggle={() => {
              if (!runner.running && n >= MOST) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="grid gap-2 lg:grid-cols-[1fr_1fr]">
            <div><div data-slot="plot" className="h-[min(440px,calc(100vh-22rem))] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={UNIT}
                equal
                deps={[r, x0, n, iterate, palette]}
                onPick={(x) => {
                  setX0(Math.max(0.01, Math.min(0.99, x)));
                  reset();
                }}
                draw={(pen) => {
                  ticks(pen);
                  pen.line([[0, 0], [1, 1]], "#3a4048", 1);
                  const pts: [number, number][] = [];
                  for (let i = 0; i <= 600; i++) pts.push([i / 600, composed(i / 600)]);
                  pen.line(pts, curve, 2.6);
                  // every rung so far, the newest brightest; the older ones stay clearly visible
                  rungs.forEach((g, i) => {
                    const age = (rungs.length - i) / Math.max(1, rungs.length);
                    pen.ctx.globalAlpha = 0.55 + 0.45 * (1 - age);
                    pen.line([[g.x0, g.y0], [g.x1, g.y1]], accent, i >= rungs.length - 2 ? 2.6 : 1.8);
                    pen.ctx.globalAlpha = 1;
                  });
                  pen.dot(x0, 0, 4, INK);
                  if (n > 0) pen.dot(series[n], series[n], 5, INK);
                  else pen.ring(x0, 0, 7, INK, 1.5);
                }}
              />
            </div><Caption>{iterate === 1 ? L("Thick curve: the rule f(x) = r x (1 - x); its height above x is the number that comes after x. Thin straight line: the diagonal, where the height equals x") : L("Thick curve: the rule applied {{n}} times in a row. Thin straight line: the diagonal, where the height equals x", { n: iterate })}{L(". One step: from the number go up or down to the curve, then across to the diagonal, which makes the next number the new x")}</Caption></div>
            <div>
              {/* which line is which, above the picture where it is read first */}
              <Text kind="note" as="div" className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
                <span><Swatch colour={accent} />{L("Solid line: the numbers, step by step, from the start x0")}</span>
                <span><Swatch colour={TWO} />{L("Dashed line: the same rule from a start one millionth higher")}</span>
              </Text>
              <div data-slot="plot" className="h-[min(440px,calc(100vh-22rem))] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={seriesBox}
                deps={[series, twin, n, levels, palette]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  for (const level of levels) pen.line([[0, level], [MOST, level]], "#2b3a4a", 1);
                  const a: [number, number][] = [];
                  const b: [number, number][] = [];
                  for (let i = 0; i <= n; i++) {
                    a.push([i, series[i]]);
                    b.push([i, twin[i]]);
                  }
                  // the second start, dashed and in its own colour, so it never reads as part of the first
                  pen.ctx.setLineDash([5, 4]);
                  pen.line(b, TWO, 1.4);
                  pen.ctx.setLineDash([]);
                  pen.line(a, accent, 1.2);
                  for (let i = 0; i <= n; i++) pen.dot(i, series[i], 2, accent);
                  if (n > 0) pen.dot(n, series[n], 4.5, INK);
                }}
              />
            </div><Caption>{L("Across: the step number. Up: the number after that many steps. The dashed line starts one millionth higher. While the number settles, the solid and dashed lines lie on top of each other. In chaos they part.")} {L("Thin horizontal lines: the values the number repeats once it has settled. How many values: {{period}} (0 means it never settles).", { period: cycle })}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={n === 0 ? undefined : cycle && nearest !== null && Math.abs(nearest - xNow) < 1e-3 ? true : cycle === 0 && gapNow > 0.05 ? false : undefined}>
              {n === 0
                ? L("The start is x0 = {{x0}}, and r = {{r}}. Press run, or one step, and follow the number: up or down to the curve, then across to the diagonal.", { x0: x0.toFixed(3), r: r.toFixed(3) })
                : cycle === 1
                  ? Math.abs(xNow - fixed) < 1e-3
                    ? L("After {{n}} steps the number is {{x}}. It sits on the value 1 - 1/r = {{fixed}}, which the rule leaves unchanged: the curve crosses the diagonal there. Such a value is called a fixed point. The steepness of the curve at that point is {{slope}}. That is between -1 and 1, so each step lands closer to the point than the one before, and the number stays.", { n, x: xNow.toFixed(4), fixed: fixed.toFixed(4), slope: (2 - r).toFixed(2) })
                    : L("After {{n}} steps the number is {{x}}. It is getting closer to the value 1 - 1/r = {{fixed}}, which the rule leaves unchanged: the curve crosses the diagonal there. Such a value is called a fixed point. The steepness of the curve at that point is {{slope}}. That is between -1 and 1, so each step lands closer to the point than the one before, and the number will stay there.", { n, x: xNow.toFixed(4), fixed: fixed.toFixed(4), slope: (2 - r).toFixed(2) })
                  : cycle > 1 && cycle <= 16
                    ? nearest !== null && Math.abs(nearest - xNow) < 1e-3
                      ? L("After {{n}} steps the number is {{x}}. It now repeats a cycle of {{cycle}} values: {{values}}. The value that the rule leaves unchanged, 1 - 1/r = {{fixed}}, still exists. But the steepness of the curve there is {{slope}}, outside the range from -1 to 1. So each step near that value lands further from it than the one before, and the number is pushed away.", { n, x: xNow.toFixed(4), cycle, values: levels.map((v) => v.toFixed(3)).join(", "), fixed: fixed.toFixed(3), slope: (2 - r).toFixed(2) })
                      : L("After {{n}} steps the number is {{x}}. It is settling into a cycle of {{cycle}} values: {{values}}. The value that the rule leaves unchanged, 1 - 1/r = {{fixed}}, still exists. But the steepness of the curve there is {{slope}}, outside the range from -1 to 1. So each step near that value lands further from it than the one before, and the number is pushed away.", { n, x: xNow.toFixed(4), cycle, values: levels.map((v) => v.toFixed(3)).join(", "), fixed: fixed.toFixed(3), slope: (2 - r).toFixed(2) })
                    : gapNow > 0.05
                      ? L("After {{n}} steps the number is {{x}}, and it has not settled on any value or cycle. The second start began one millionth higher and is now {{gap}} away: the two numbers have nothing in common any more. No step of the rule involved chance. The Lyapunov exponent, the average rate at which close starts move apart, is {{lambda}}. It is above zero, so close starts move apart.", { n, x: xNow.toFixed(4), gap: gapNow.toFixed(gapNow < 0.001 ? 6 : 3), lambda: lambda.toFixed(3) })
                      : L("After {{n}} steps the number is {{x}}, and it has not settled on any value or cycle. The second start began one millionth higher and is now {{gap}} away, and the gap is growing. The Lyapunov exponent, the average rate at which close starts move apart, is {{lambda}}. It is above zero, so close starts move apart.", { n, x: xNow.toFixed(4), gap: gapNow.toFixed(gapNow < 0.001 ? 6 : 3), lambda: lambda.toFixed(3) })}
            </Verdict>
            <Readout
              rows={[
                [L("r, the growth rate"), r.toFixed(4)],
                [L("What the number settles on"), cycle ? L("A cycle of period {{period}}: the number repeats after this many steps", { period: cycle }) : L("Nothing: no repeat found with a period up to 64 steps")],
                [L("Lyapunov exponent: average rate at which close starts move apart, per step"), lambda.toFixed(4)],
                [L("What that number says"), lambda > 0.005 ? L("Above zero: close starts move apart, so the number is chaotic") : lambda < -0.005 ? L("Below zero: close starts come together, so the number settles") : L("Close to zero: at this r the behaviour is about to change")],
                [L("Value that the rule leaves unchanged, 1 - 1/r"), r > 1 ? fixed.toFixed(4) : L("None between 0 and 1")],
                [L("Steepness of the curve at that value, 2 - r"), r > 1 ? (2 - r).toFixed(4) : "-"],
                [L("Does the number stay there? Only while the steepness is between -1 and 1"), r > 1 ? (Math.abs(2 - r) < 1 ? L("Yes") : L("No, so the number moves to a cycle of two or more values")) : "-"],
                [L("Distance now between the two starts (solid and dashed lines)"), n > 0 ? gapNow.toExponential(2) : TWIN.toExponential(0)],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("Why does the number settle or not? Near the value that the rule leaves unchanged, each step multiplies the distance to that value by the steepness of the curve there. If the steepness is between -1 and 1, the distance shrinks, and the number is pulled in. Past -1, the distance grows, and the number is pushed away. Then a cycle of two values takes over and holds for a while, until it too splits into four. Another page of this topic raises r slowly and draws, for every value of r, the values the number settles on.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`chaos-logistic-r${r.toFixed(3)}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
