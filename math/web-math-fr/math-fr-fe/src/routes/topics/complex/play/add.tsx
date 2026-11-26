import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
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
import { L } from "@/lib/lang";
import { INK, MUTED, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { abs, add, scale, show, sub, type C } from "@/systems/complex";

export const Route = createFileRoute("/topics/complex/play/add")({
  loader: () => api.system(TOPIC, "add"),
  component: AddPage,
});

const BOX: Box = { x0: -4.5, x1: 4.5, y0: -4.5, y1: 4.5 };
const FRAMES = 60;
const OPS = [
  { id: "add", label: L("z plus w") },
  { id: "sub", label: L("z minus w") },
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
    <>
      <TaskPage
        title={system?.name ?? L("Complex numbers: adding")}
        job={L("How are two points of a plane added as numbers? A complex number is a point of a flat plane, written a + bi: a is how far across from zero, b is how far up. It can also be drawn as an arrow from zero to that point. To add two of them, a copy of the second arrow is placed, without turning it, so that it starts at the tip of the first. The tip of the copy lands on the sum. In numbers, the across parts are added together and the up parts are added together, each pair on its own. The picture shows two numbers, z and w. Dragging near the tip of either arrow moves it. Pressing run lays the copy of w out from the tip of z.")}
        input={
          <div className="space-y-3">
            <Choices options={OPS} value={op} onPick={(id) => { setOp(id); reset(); }} />
            <Text kind="note" as="p">
              {L("z and w are the two numbers; each is named at the tip of its arrow. Dragging moves whichever tip is nearer. 'z minus w' subtracts: it adds w turned half way round, which is the number minus w.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(f * 100)}
            limit={100}
            what={L("per cent of the way")}
            onToggle={() => {
              if (!runner.running && tick >= FRAMES) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many * 6)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage}>
            <div data-slot="plot" className="h-[min(480px,calc(100vh-20rem))] overflow-hidden">
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
                  pen.text(L("Across"), BOX.x1 - 0.8, -0.35, MUTED, "center");
                  pen.text(L("Up"), 0.3, BOX.y1 - 0.5, MUTED, "left");
                }}
              />
            </div>
            <Caption>
              {op === "sub"
                ? L("Two arrows from zero, named z and w at their tips. A line starting at the tip of z is a copy of w turned half way round, that is minus w; a dot moves along it. When the dot stops, a third arrow from zero to the dot is drawn and named: it is the difference z - w.")
                : L("Two arrows from zero, named z and w at their tips. A line starting at the tip of z is a copy of w, moved without turning; a dot moves along it. When the dot stops, a third arrow from zero to the dot is drawn and named: it is the sum z + w.")}
            </Caption>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {f === 0
                ? L("z is {{z}} and w is {{w}}. Press run: a copy of w is laid out from the tip of z.", { z: show(z), w: show(w) })
                : f < 1
                  ? L("The dot has gone {{p}} per cent of the way along the copy of w, starting from the tip of z. It is at {{at}}.", { p: Math.round(f * 100), at: show(walker) })
                  : op === "add"
                    ? L("{{z}} plus {{w}} is {{r}}. Across: {{z0}} + {{w0}} = {{r0}}. Up: {{z1}} + {{w1}} = {{r1}}. The two parts were added separately. In the picture, the sum is the far corner of the parallelogram, the four-sided figure with two sides along z and two along w.", { z: show(z), w: show(w), r: show(result), z0: z[0], w0: w[0], r0: result[0], z1: z[1], w1: w[1], r1: result[1] })
                    : L("{{z}} minus {{w}} is {{r}}. Across: {{z0}} - {{w0}} = {{r0}}. Up: {{z1}} - {{w1}} = {{r1}}. The two parts were subtracted separately. In the picture, the difference is the far corner of the parallelogram, the four-sided figure with two sides along z and two along minus w.", { z: show(z), w: show(w), r: show(result), z0: z[0], w0: w[0], r0: result[0], z1: z[1], w1: w[1], r1: result[1] })}
            </Verdict>
            <Readout
              rows={[
                ["z", show(z)],
                ["w", show(w)],
                [op === "add" ? "z + w" : "z - w", show(result)],
                [L("Length of z and of w: distance from zero to each tip"), `${abs(z).toFixed(2)}, ${abs(w).toFixed(2)}`],
                [L("Length of the result"), abs(result).toFixed(2)],
                [L("Length of z plus length of w"), L("{{sum}}. The result is this long only when z and w point the same way.", { sum: (abs(z) + abs(w)).toFixed(2) })],
                [L("Check by taking the second number away"), show(sub(result, step)) === show(z) ? L("taking it away from the result gives z back") : "-"],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("Adding moves an arrow but never turns it: the copy of w keeps the direction of w. Turning comes from multiplying. The page 'Complex numbers: multiplying', in the same topic, shows how.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-add" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
