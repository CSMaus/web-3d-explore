import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ChaosTabs } from "@/components/ChaosTabs";
import { Equations } from "@/components/Equations";
import { PaletteBar } from "@/components/PaletteBar";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { CHAOS, TOPIC } from "@/lib/chaos";
import { INK, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { oscillator, step as advance, type Method } from "@/systems/flow";

export const Route = createFileRoute("/topics/chaos/play/solvers")({
  loader: () => api.system(TOPIC, "solvers"),
  component: SolversPage,
});

const METHODS: Method[] = ["euler", "midpoint", "rk4"];
const ORDER: Record<Method, number> = { euler: 1, midpoint: 2, rk4: 4 };
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
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={CHAOS} />
      <div className="mt-4">
        <ChaosTabs />
      </div>
      <TaskPage
        title={system?.name ?? "Solving it by stepping"}
        job="A swing with no friction: after a whole number of turns it is exactly back where it began, so the true answer is known and the stepping can be scored. The job is to step round one turn with each method, halve the step, do it again, and read off how fast each method's error falls."
        input={
          <div className="space-y-3">
            <Slider label="Turns" min={1} max={8} step={1} value={turns} format={(v) => String(Math.round(v))} onChange={(v) => { setTurns(Math.round(v)); reset(); }} />
            <Slider label="Coarsest steps" min={8} max={64} step={4} value={coarsest} format={(v) => `${Math.round(v)} a turn`} onChange={(v) => { setCoarsest(Math.round(v)); reset(); }} />
            <Slider label="Halvings" min={3} max={12} step={1} value={levels} format={(v) => String(Math.round(v))} onChange={(v) => { setLevels(Math.round(v)); reset(); }} />
            <p className="text-[11px] text-muted">
              The run always ends exactly on a whole turn. Ending a fraction of a step past it adds
              an error of its own that swamps the method and makes Runge-Kutta look first order.
            </p>
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={shown}
            what="step sizes tried"
            limit={levels}
            onToggle={() => {
              if (!runner.running && shown >= levels) reset();
              runner.toggle();
            }}
            onStep={(many) => setDone((v) => Math.min(levels, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="grid gap-2 lg:grid-cols-[300px_1fr]">
            <div><div className="h-[min(400px,calc(100vh-24rem))] overflow-hidden rounded border border-edge">
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
            </div><Caption>{shown > 0 ? `${row("euler").steps / turns} steps a turn: where each method ends up after ${turns} turn${turns > 1 ? "s" : ""}` : "The true orbit is the circle; the state should come back to the white dot"}</Caption></div>
            <div><div className="h-[min(400px,calc(100vh-24rem))] overflow-hidden rounded border border-edge">
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
                  pen.text("Double precision floor", bounds.x0 + 0.05, Math.log10(2.2e-16) + 0.1, "#7a5a5a");
                  table.forEach((t, i) => {
                    const colour = colourOf(i);
                    const pts: [number, number][] = t.rows.slice(0, shown).map((r) => [Math.log10(r.dt), Math.log10(Math.max(r.error, 1e-16))]);
                    pen.line(pts, colour, 1.6);
                    for (const [x, y] of pts) pen.dot(x, y, 3, colour);
                    if (pts.length) {
                      const last = pts[pts.length - 1];
                      pen.text(`  ${t.how}`, last[0], last[1], colour);
                    }
                  });
                }}
              />
            </div><Caption>Error after the run against step size, both on powers of ten. Steeper is a higher order.</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {shown === 0
                ? `${coarsest} steps a turn to begin with, then the step halved ${levels - 1} times. Press run: each step size is tried by all three methods and its error lands on the chart.`
                : shown === 1
                  ? `${row("euler").steps / turns} steps a turn. Euler ends ${row("euler").error.toFixed(3)} from where it started and its orbit spirals outward: each straight step leaves the circle a little, and the gain is never given back. Midpoint misses by ${row("midpoint").error.toExponential(1)}, Runge-Kutta by ${row("rk4").error.toExponential(1)}.`
                  : `${row("euler").steps / turns} steps a turn, half the last size. Euler's error fell by ${Math.pow(2, table[0].gains[level - 1]).toFixed(1)}x, midpoint's by ${Math.pow(2, table[1].gains[level - 1]).toFixed(1)}x and Runge-Kutta's by ${table[2].rows[level].error > 1e-13 ? `${Math.pow(2, table[2].gains[level - 1]).toFixed(1)}x` : "down to the rounding floor"}: halving the step buys two, four and sixteen. That is what order one, two and four mean.`}
            </Verdict>
            <Readout
              rows={[
                ["Turns run", String(turns)],
                ["Step sizes tried", `${shown} of ${levels}`],
                ...table.map((t) => [`${t.how}: fitted order`, `${Number.isNaN(t.slope) ? "-" : t.slope.toFixed(3)}  (exactly ${ORDER[t.how]})`] as [string, string]),
                ...(shown > 0 ? table.map((t) => [`${t.how}: error at this step`, t.rows[level].error.toExponential(2)] as [string, string]) : []),
                ["Energy at the end, exactly 0.5", shown > 0 ? table.map((t) => `${t.how} ${t.rows[level].energy.toFixed(4)}`).join(", ") : "-"],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              Euler's outward spiral is not a rounding error: a straight step from a point on a
              circle always lands outside it. The higher methods look inside the step before moving.
              Runge-Kutta stops reporting sixteen once its error reaches the rounding floor of
              double precision, and those rows are left out of the fitted slope.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="chaos-solvers" />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
