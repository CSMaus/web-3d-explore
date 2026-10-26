import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { FAINT, MUTED, ONE, SKY, plate, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { CURVES, gap, staircase, stepAt, type Curve } from "@/systems/depth";
import { ACTS, params, predict } from "@/systems/net";

export const Route = createFileRoute("/topics/networks/play/any")({
  loader: () => api.system(TOPIC, "any"),
  component: AnyPage,
});

const SHAPES = (Object.keys(CURVES) as Curve[]).map((id) => ({ id, label: CURVES[id].label }));
const SAMPLES = 240;

function AnyPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [curve, setCurve] = useState<Curve>("bump");
  const [n, setN] = useState(12);
  const [steep, setSteep] = useState(60);
  const [perFrame, setPerFrame] = useState(0.5);
  const [k, setK] = useState(0);
  const runner = useRunner((t) => setK(t), { perFrame, stopAt: n });
  const restart = () => {
    runner.reset();
    setK(0);
  };

  const f = CURVES[curve].f;
  const on = Math.min(k, n);
  const net = useMemo(() => staircase(f, n, steep, on), [f, n, steep, on]);
  const before = useMemo(() => staircase(f, n, steep, Math.max(0, on - 1)), [f, n, steep, on]);
  const fit = useMemo(() => gap(net, f), [net, f]);
  const target = useMemo(() => Array.from({ length: SAMPLES + 1 }, (_, i) => [i / SAMPLES, f(i / SAMPLES)] as [number, number]), [f]);
  const range = useMemo(() => {
    const ys = target.map((p) => p[1]);
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const pad = Math.max(0.15, (hi - lo) * 0.15);
    return { lo, hi, pad };
  }, [target]);
  const box = useMemo<Box>(() => ({ x0: -0.02, x1: 1.02, y0: range.lo - range.pad, y1: range.hi + range.pad }), [range]);
  const rises = useMemo(() => net.W[1][0].slice(0, on), [net, on]);
  const tallest = Math.max(0.05, ...rises.map(Math.abs));
  const stepBox = useMemo<Box>(() => ({ x0: -0.02, x1: 1.02, y0: -tallest * 1.15, y1: tallest * 1.15 }), [tallest]);
  const count = params(net);

  return (
    <div>
      <TaskPage
        title={system?.name ?? "Any curve at all"}
        job="The last page bent one boundary out of a few units. This one asks how far that goes. Pick a curve. A network with one input, one row of squashing units and one output is built so that each hidden unit is a single step of a staircase: switched on at one place along the line, with a height. Run adds the units one at a time, and the staircase follows the curve. More units, or steeper steps, and it follows as closely as wanted. That is what a network can draw: anything, out of enough small steps."
        input={
          <div className="space-y-3">
            <Choices options={SHAPES} value={curve} onPick={(id) => { setCurve(id); restart(); }} />
            <Slider label="Units" min={2} max={40} step={1} value={n} format={(v) => `${v}`} onChange={(v) => { setN(v); restart(); }} />
            <Slider label="Steepness" min={5} max={300} step={5} value={steep} format={(v) => `${v}`} onChange={(v) => { setSteep(v); restart(); }} />
            <Text kind="note" as="p">
              Units is how many steps the staircase has. Steepness is the weight into each unit:
              a low value makes each step a gentle slope, a high one makes it a sharp edge. The
              heights are read from the curve; nothing here is trained, so what is shown is what
              the structure can hold, before any learning.
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={on}
            what="units on"
            limit={n}
            onToggle={() => {
              if (!runner.running && on >= n) restart();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={restart}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div data-slot="plot" className="h-[320px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={box}
                deps={[net, before, target, box, on]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(target, MUTED, 1.4);
                  const trace = (m: typeof net) => Array.from({ length: SAMPLES + 1 }, (_, i) => [i / SAMPLES, predict(m, [i / SAMPLES])[0]] as [number, number]);
                  if (on > 0) pen.line(trace(before), "rgba(232,232,234,0.35)", 1);
                  pen.line(trace(net), ONE, 2.2);
                  if (on > 0) {
                    const s = stepAt(on - 1, n);
                    pen.line([[s, pen.box.y0], [s, pen.box.y1]], SKY, 1);
                    plate(pen, `Unit ${on} switches on here`, s > 0.6 ? s - 0.01 : s + 0.01, pen.box.y1 - (pen.box.y1 - pen.box.y0) * 0.06, SKY, s > 0.6 ? "right" : "left");
                  }
                  plate(pen, "Grey: the curve to draw.  Green: the network", pen.box.x0 + 0.02, pen.box.y0 + (pen.box.y1 - pen.box.y0) * 0.05, MUTED);
                }}
              />
            </div><Caption>The target and the network's output over the input, from 0 to 1</Caption></div>
            <div><div data-slot="plot" className="h-[200px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={stepBox}
                deps={[net, on, stepBox, steep, n]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  for (let i = 0; i < on; i++) {
                    const s = stepAt(i, n);
                    const h = net.W[1][0][i];
                    const pts = Array.from({ length: SAMPLES + 1 }, (_, j) => [j / SAMPLES, h * ACTS.sigmoid.f(steep * (j / SAMPLES - s))] as [number, number]);
                    pen.line(pts, i === on - 1 ? SKY : "rgba(165,227,160,0.55)", i === on - 1 ? 2 : 1);
                  }
                }}
              />
            </div><Caption>Each hidden unit on its own: one squash, one height. The green curve above is their sum plus a bias</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={on >= n ? fit.worst < 0.1 : undefined}>
              {on === 0
                ? `No unit is on. The network's output is flat at ${net.b[1][0].toFixed(3)}, its output bias. Press run: each step switches on one more hidden unit, and each unit adds one step to the staircase.`
                : on < n
                  ? `${on} of ${n} units on. The network's curve is within ${fit.worst.toFixed(3)} of the target everywhere so far, the worst gap at x = ${fit.at.toFixed(2)}, which is ${fit.at > stepAt(on - 1, n) ? "to the right of the last step, where no unit has switched on yet" : "inside the part already built"}.`
                  : `All ${n} units on. The network's curve is within ${fit.worst.toFixed(3)} of the target everywhere, average gap ${fit.mean.toFixed(4)}. ${fit.worst > 0.1 ? "The gap is set by the steps: more units make them narrower, more steepness makes them sharper, and either shrinks it." : "More units or steeper steps shrink the gap further, without limit."} There is no curve that cannot be followed this way, which is the reason a network can do any job of this kind: not cleverness, but enough small steps.`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>Hidden units on</dt>
              <dd className="text-right text-foreground/80">{on} of {n}</dd>
              <dt>Numbers in the network</dt>
              <dd className="text-right text-foreground/80">{count.total}</dd>
              <dt>Worst gap to the target</dt>
              <dd className="text-right text-foreground/80">{fit.worst.toFixed(4)} at x = {fit.at.toFixed(2)}</dd>
              <dt>Average gap</dt>
              <dd className="text-right text-foreground/80">{fit.mean.toFixed(4)}</dd>
              <dt>Height of the last step switched on</dt>
              <dd className="text-right text-foreground/80">{on > 0 ? net.W[1][0][on - 1].toFixed(3) : "none"}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              A hidden unit's total is the steepness times the input minus its bias, so the unit
              switches from near zero to near one where the input passes one fixed place. Its
              output weight is the height of that step. The output unit adds every step up. On
              the saw, the sharp drops need a very steep unit, and a gentle one shows exactly why.
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`any-${curve}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
