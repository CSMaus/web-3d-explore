import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { PaletteBar } from "@/components/PaletteBar";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/chaos";
import { INK, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { oscillator, step as advance, type Method } from "@/systems/flow";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/chaos/play/solvers")({
  loader: () => api.system(TOPIC, "solvers"),
  component: SolversPage,
});

const METHODS: Method[] = ["euler", "midpoint", "rk4"];
const ORDER: Record<Method, number> = { euler: 1, midpoint: 2, rk4: 4 };
const NAME: Record<Method, string> = { euler: L("Euler's method"), midpoint: L("Midpoint method"), rk4: L("Runge-Kutta method") };
const TURN = 2 * Math.PI;

/**
 * the error after a whole number of turns, so the end time lands exactly on the
 * exact answer. an end time a fraction of a step past the period contributes an
 * error of its own that swamps the method's, which is a real trap.
 */
function errorAfter(how: Method, steps: number, turns: number) {
  const f = oscillator(0, 1);
  const dt = (TURN * turns) / steps;
  let x = [1, 0];
  const trail: [number, number][] = [[1, 0]];
  for (let i = 0; i < steps; i++) {
    x = advance(f, x, i * dt, dt, how);
    trail.push([x[0], x[1]]);
  }
  return { error: Math.hypot(x[0] - 1, x[1]), dt, energy: 0.5 * (x[0] ** 2 + x[1] ** 2), trail };
}

function SolversPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);
  const [turns, setTurns] = useState(1);
  const [coarsest, setCoarsest] = useState(16);
  const [levels, setLevels] = useState(7);
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.04);

  const runner = useRunner((n) => setDone(n), { perFrame, stopAt: levels });
  const shown = Math.min(done, levels);

  const table = useMemo(
    () =>
      METHODS.map((how) => {
        const rows: { steps: number; error: number; dt: number; energy: number; trail: [number, number][] }[] = [];
        for (let i = 0; i < levels; i++) {
          const steps = Math.round(coarsest * Math.pow(2, i)) * turns;
          rows.push({ steps, ...errorAfter(how, steps, turns) });
        }
        const gains = rows.slice(1).map((r, i) => Math.log2(rows[i].error / r.error));
        const usable = rows.filter((r) => r.error > 1e-13);
        let slope = NaN;
        if (usable.length >= 2) {
          const xs = usable.map((r) => Math.log(r.dt));
          const ys = usable.map((r) => Math.log(r.error));
          const k = xs.length;
          const mx = xs.reduce((a, b) => a + b, 0) / k;
          const my = ys.reduce((a, b) => a + b, 0) / k;
          let top = 0;
          let bot = 0;
          for (let i = 0; i < k; i++) {
            top += (xs[i] - mx) * (ys[i] - my);
            bot += (xs[i] - mx) ** 2;
          }
          slope = bot ? top / bot : NaN;
        }
        return { how, rows, gains, slope };
      }),
    [turns, coarsest, levels],
  );
  const colourOf = (i: number) => palette.roles[i % palette.roles.length];
  const bounds = useMemo(() => {
    const all = table.flatMap((t) => t.rows);
    const dts = all.map((r) => Math.log10(r.dt));
    const es = all.map((r) => Math.log10(Math.max(r.error, 1e-16)));
    return { x0: Math.min(...dts) - 0.2, x1: Math.max(...dts) + 0.2, y0: Math.min(...es) - 0.4, y1: Math.max(...es) + 0.4 };
  }, [table]);
  const level = Math.max(0, shown - 1);
  const row = (how: Method) => table.find((t) => t.how === how)!.rows[level];
  const reset = () => {
    runner.reset();
    setDone(0);
  };
  const circleBox = useMemo(() => {
    const r = Math.max(1.3, ...table[0].rows.slice(0, Math.max(1, shown)).flatMap((x) => x.trail.map((p) => Math.hypot(p[0], p[1]))));
    return { x0: -r * 1.1, x1: r * 1.1, y0: -r * 1.1, y1: r * 1.1 };
  }, [table, shown]);

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("Solving an equation step by step")}
        job={L("How much better does the answer get when the step is made shorter? The test case is a weight on a spring, with no friction. It swings back and forth, and after each full swing, called a turn, it is exactly back where it started. So the exact answer is known, and the error of each stepping method can be measured. The page runs the swing with three methods. Euler's method moves straight along the direction found at the start of each step. The midpoint method first looks half a step ahead. The Runge-Kutta method looks at four places inside the step. The page starts with 16 steps a turn, then halves the step again and again, and records how far each method ends from the start. The question: when the step is halved, how many times smaller does each error get?")}
        input={
          <div className="space-y-3">
            <Slider label={L("Full turns in one run")} min={1} max={8} step={1} value={turns} format={(v) => String(Math.round(v))} onChange={(v) => { setTurns(Math.round(v)); reset(); }} />
            <Slider label={L("Steps per turn at the start")} min={8} max={64} step={4} value={coarsest} format={(v) => L("{{n}} per turn", { n: Math.round(v) })} onChange={(v) => { setCoarsest(Math.round(v)); reset(); }} />
            <Slider label={L("Number of step lengths to try")} min={3} max={12} step={1} value={levels} format={(v) => String(Math.round(v))} onChange={(v) => { setLevels(Math.round(v)); reset(); }} />
            <Text kind="note" as="p">
              {L("Each run stops exactly at the end of a full turn. If it stopped a little before or after, that gap would add an error of its own. This extra error would hide the error of the method.")}
            </Text>
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={shown}
            what={L("step sizes tried")}
            limit={levels}
            onToggle={() => {
              if (!runner.running && shown >= levels) reset();
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
          <section ref={stage} className="grid gap-2 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div><div data-slot="plot" className="h-[min(400px,calc(100vh-24rem))] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={circleBox}
                equal
                deps={[table, shown, palette, circleBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes("#23262c");
                  const circle: [number, number][] = [];
                  for (let i = 0; i <= 200; i++) circle.push([Math.cos((i / 200) * TURN), Math.sin((i / 200) * TURN)]);
                  pen.line(circle, "#3a4048", 1);
                  if (shown > 0) {
                    METHODS.forEach((how, i) => {
                      const r = row(how);
                      pen.line(r.trail, colourOf(i), how === "euler" ? 1.4 : 1);
                      const last = r.trail[r.trail.length - 1];
                      pen.dot(last[0], last[1], 3.5, colourOf(i));
                    });
                  }
                  pen.dot(1, 0, 4, INK);

                }}
              />
            </div><Caption>{shown > 0 ? (turns > 1 ? L("Across: position of the weight. Up: its speed. Circle: the exact path. The other lines: the path of each method with {{steps}} steps per turn, over {{turns}} turns. The thickest of them is Euler's method. Dots: where each method stopped", { steps: row("euler").steps / turns, turns }) : L("Across: position of the weight. Up: its speed. Circle: the exact path. The other lines: the path of each method with {{steps}} steps per turn, over {{turns}} turn. The thickest of them is Euler's method. Dots: where each method stopped", { steps: row("euler").steps / turns, turns })) : L("Across: position of the weight. Up: its speed. Circle: the exact path. It comes back to the dot on the right after each turn")}</Caption></div>
            <div><div data-slot="plot" className="h-[min(400px,calc(100vh-24rem))] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={bounds}
                deps={[table, shown, palette, bounds]}
                draw={(pen) => {
                  pen.axes("#23262c");
                  for (let g = Math.ceil(bounds.y0); g <= bounds.y1; g++) {
                    pen.line([[bounds.x0, g], [bounds.x1, g]], "#191d23", 1);
                    pen.text(`1e${g}`, bounds.x0 + 0.05, g + 0.08, "#4a525e");
                  }
                  for (let g = Math.ceil(bounds.x0); g <= bounds.x1; g++) {
                    pen.line([[g, bounds.y0], [g, bounds.y1]], "#191d23", 1);
                    pen.text(`h=1e${g}`, g + 0.03, bounds.y0 + 0.12, "#4a525e");
                  }
                  pen.line([[bounds.x0, Math.log10(2.2e-16)], [bounds.x1, Math.log10(2.2e-16)]], "#4a3a3a", 1);
                  pen.text(L("Rounding limit"), bounds.x0 + 0.05, Math.log10(2.2e-16) + 0.1, "#7a5a5a");
                  table.forEach((t, i) => {
                    const colour = colourOf(i);
                    const pts: [number, number][] = t.rows.slice(0, shown).map((r) => [Math.log10(r.dt), Math.log10(Math.max(r.error, 1e-16))]);
                    pen.line(pts, colour, 1.6);
                    for (const [x, y] of pts) pen.dot(x, y, 3, colour);
                    if (pts.length) {
                      const last = pts[pts.length - 1];
                      pen.text(`  ${NAME[t.how]}`, last[0], last[1], colour);
                    }
                  });
                }}
              />
            </div><Caption>{L("Each line is one method, named at its end. Across: the step length h. Up: the error at the end of the run. Both axes count in powers of ten: 1e-3 means 0.001. The steeper a line, the faster its error falls as the step gets shorter. The flat line marked as the rounding limit is the smallest error a computer can reach, about 2e-16.")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {shown === 0
                ? L("The first try uses {{coarsest}} steps per turn. Then the step is halved {{halvings}} times. Press run: each step length is tried with all three methods, and each error becomes a point on the error chart.", { coarsest, halvings: levels - 1 })
                : shown === 1
                  ? L("{{steps}} steps per turn. Euler's method ends {{euler}} away from the starting point, and its path spirals outward. Each straight step leaves the circle a little, and that is never given back. The midpoint method misses by {{midpoint}}, the Runge-Kutta method by {{rk4}}.", { steps: row("euler").steps / turns, euler: row("euler").error.toFixed(3), midpoint: row("midpoint").error.toExponential(1), rk4: row("rk4").error.toExponential(1) })
                  : L("{{steps}} steps per turn, so each step is half as long as before. The error of Euler's method became {{euler}} times smaller, that of the midpoint method {{midpoint}} times smaller. The Runge-Kutta method: {{rk4}}. So halving the step makes the errors about 2, 4 and 16 times smaller. This is what a method of order 1, 2 or 4 means: halving the step divides its error by 2 multiplied by itself that many times.", { steps: row("euler").steps / turns, euler: Math.pow(2, table[0].gains[level - 1]).toFixed(1), midpoint: Math.pow(2, table[1].gains[level - 1]).toFixed(1), rk4: table[2].rows[level].error > 1e-13 ? L("error {{n}} times smaller", { n: Math.pow(2, table[2].gains[level - 1]).toFixed(1) }) : L("its error has reached the rounding limit of the computer and cannot fall further") })}
            </Verdict>
            <Readout
              rows={[
                [L("Full turns in one run"), String(turns)],
                [L("Step sizes tried"), L("{{n}} of {{total}}", { n: shown, total: levels })],
                ...table.map((t) => [L("{{how}}: order, the slope of its line on the chart", { how: NAME[t.how] }), L("{{slope}} (in theory {{order}})", { slope: Number.isNaN(t.slope) ? "-" : t.slope.toFixed(3), order: ORDER[t.how] })] as [string, string]),
                ...(shown > 0 ? table.map((t) => [L("{{how}}: error at the current step length", { how: NAME[t.how] }), t.rows[level].error.toExponential(2)] as [string, string]) : []),
                [L("Energy at the end: (position² + speed²) / 2, exact value 0.5"), shown > 0 ? table.map((t) => `${NAME[t.how]} ${t.rows[level].energy.toFixed(4)}`).join(", ") : "-"],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("The outward spiral of Euler's method is not caused by rounding. A straight step from a point on a circle always lands outside the circle, so the energy grows with every step. The other two methods look inside the step before moving. A computer keeps about 16 digits of each number, so no error can fall below about 2e-16. Once the Runge-Kutta error comes near that limit, it stops falling 16 times, and those step lengths are left out when its order is measured.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="chaos-solvers" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
