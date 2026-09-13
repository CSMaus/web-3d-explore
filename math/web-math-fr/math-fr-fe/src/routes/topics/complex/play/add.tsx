import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/complex";
import { INK, MUTED, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { abs, add, scale, show, sub, type C } from "@/systems/complex";
import { ComplexFrame } from "./-shared";

export const Route = createFileRoute("/topics/complex/play/add")({
  loader: () => api.system(TOPIC, "add"),
  component: AddPage,
});

const BOX: Box = { x0: -4.5, x1: 4.5, y0: -4.5, y1: 4.5 };
const FRAMES = 60;
const OPS = [
  { id: "add", label: "z plus w" },
  { id: "sub", label: "z minus w" },
];

function AddPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [z, setZ] = useState<C>([2, 1]);
  const [w, setW] = useState<C>([-1, 2]);
  const [grab, setGrab] = useState<"z" | "w" | null>(null);
  const [op, setOp] = useState("add");
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(1);

  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: FRAMES });
  const f = Math.min(tick, FRAMES) / FRAMES;
  const step = op === "add" ? w : scale(w, -1);
  const result = add(z, step);
  const walker = add(z, scale(step, f));
  const reset = () => {
    runner.reset();
    setTick(0);
  };

  return (
    <ComplexFrame>
      <TaskPage
        title={system?.name ?? "Adding: arrows tip to tail"}
        job="Every number is an arrow from zero to its place. To add two, walk the second arrow out from the tip of the first; where it ends is the sum. The along parts add on their own and the up parts add on their own, and they never mix. Drag either arrow's tip and run the walk."
        input={
          <div className="space-y-3">
            <Choices options={OPS} value={op} onPick={(id) => { setOp(id); reset(); }} />
            <p className="text-[11px] text-muted">
              Green is z, rose is w. Drag either tip. Subtracting is adding the arrow turned round.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(f * 100)}
            limit={100}
            what="per cent of the walk"
            onToggle={() => {
              if (!runner.running && tick >= FRAMES) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(FRAMES, v + many * 6))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage}>
            <div className="h-[min(480px,calc(100vh-20rem))] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={BOX}
                equal
                deps={[z, w, op, f]}
                onDrag={(x, y) => {
                  const which = grab ?? (Math.hypot(z[0] - x, z[1] - y) <= Math.hypot(w[0] - x, w[1] - y) ? "z" : "w");
                  if (grab === null) setGrab(which);
                  const p: C = [Math.round(x * 4) / 4, Math.round(y * 4) / 4];
                  if (which === "z") setZ(p);
                  else setW(p);
                  reset();
                }}
                onRelease={() => setGrab(null)}
                draw={(pen) => {
                  ticks(pen, { x: 1, y: 1 });
                  pen.axes("#3a4048");
                  pen.arrow(0, 0, z[0], z[1], ONE);
                  pen.arrow(0, 0, w[0], w[1], TWO);
                  pen.text(`z = ${show(z)}`, z[0], z[1] + 0.3, ONE, "center");
                  pen.text(`w = ${show(w)}`, w[0], w[1] + 0.3, TWO, "center");
                  // the second arrow, carried to the first's tip and walked out
                  pen.line([[z[0], z[1]], [walker[0], walker[1]]], op === "add" ? TWO : "#c75ab0", 1.6);
                  pen.dot(walker[0], walker[1], 5, INK);
                  if (f >= 1) {
                    pen.arrow(0, 0, result[0], result[1], SKY);
                    pen.text(`${op === "add" ? "z + w" : "z - w"} = ${show(result)}`, result[0], result[1] - 0.4, SKY, "center");
                  }
                  pen.text("along", BOX.x1 - 0.8, -0.35, MUTED, "center");
                  pen.text("up", 0.3, BOX.y1 - 0.5, MUTED, "left");
                }}
              />
            </div>
            <Caption>Green: z. Rose: w{op === "sub" ? ", turned round for subtracting" : ""}. The white dot walks w out from the tip of z; the sky arrow is where it ends, the {op === "add" ? "sum" : "difference"}.</Caption>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {f === 0
                ? `z is ${show(z)} and w is ${show(w)}. Press run and w is walked out from the tip of z.`
                : f < 1
                  ? `${Math.round(f * 100)} per cent of the way along w from the tip of z: the dot is at ${show(walker)}.`
                  : `${show(z)} ${op === "add" ? "plus" : "minus"} ${show(w)} is ${show(result)}: along, ${z[0]} ${op === "add" ? "+" : "-"} ${w[0]} = ${result[0]}; up, ${z[1]} ${op === "add" ? "+" : "-"} ${w[1]} = ${result[1]}. The two parts were added separately, and the answer is the far corner of the parallelogram.`}
            </Verdict>
            <Readout
              rows={[
                ["z", show(z)],
                ["w", show(w)],
                [op === "add" ? "z + w" : "z - w", show(result)],
                ["Length of z, of w", `${abs(z).toFixed(2)}, ${abs(w).toFixed(2)}`],
                ["Length of the result", abs(result).toFixed(2)],
                ["The two lengths added", `${(abs(z) + abs(w)).toFixed(2)}, which the result only reaches if they point the same way`],
                ["Sub check", show(sub(result, step)) === show(z) ? "taking w away again gives z back" : "-"],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              Adding never turns anything: the sum's direction comes out of the two arrows, not out
              of the rule. The turning is all in multiplying, and that is the next page.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-add" />
            <Equations system={system} />
          </>
        }
      />
    </ComplexFrame>
  );
}
