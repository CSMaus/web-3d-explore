import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useRef, useState } from "react";
import { Caption } from "@/components/Caption";
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
import { abs, fromPolar, mul, show, turns, type C } from "@/systems/complex";

export const Route = createFileRoute("/topics/complex/play/multiply")({
  loader: () => api.system(TOPIC, "multiply"),
  component: MultiplyPage,
});

const BOX: Box = { x0: -5, x1: 5, y0: -5, y1: 5 };
const FRAMES = 80;

function MultiplyPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [z, setZ] = useState<C>([2, 1]);
  const [w, setW] = useState<C>([0.5, 1.5]);
  const [grab, setGrab] = useState<"z" | "w" | null>(null);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(1);

  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: FRAMES });
  const f = Math.min(tick, FRAMES) / FRAMES;
  const product = mul(z, w);
  // first the turn, then the stretch, so the two halves of the rule are seen apart
  const turnPart = Math.min(1, f * 2);
  const stretchPart = Math.max(0, f * 2 - 1);
  const angleNow = turns(z) + turns(w) * turnPart;
  const lengthNow = abs(z) * (1 + (abs(w) - 1) * stretchPart);
  const now = fromPolar(lengthNow, angleNow);
  const reset = () => {
    runner.reset();
    setTick(0);
  };
  const deg = (t: number) => L("{{n}} deg", { n: (t * 360).toFixed(0) });

  return (
    <>
      <TaskPage
        title={system?.name ?? L("Complex numbers: multiplying")}
        job={L("What happens to an arrow when two complex numbers are multiplied? A complex number is a point of a flat plane, written a + bi: a is how far across from zero, b is how far up. It is drawn as an arrow from zero to that point. Every arrow has a length, the distance from zero to its tip, and an angle, measured anticlockwise from the right-hand half of the horizontal axis. The rule for multiplying is short: the lengths are multiplied and the angles are added. The picture shows two numbers, z and w. Pressing run makes their product in two moves: z is first turned by the angle of w, then stretched by the length of w. Dragging near either tip moves that arrow.")}
        input={
          <Text kind="note" as="p">
            {L("z and w are named at the tips of their arrows. Dragging moves whichever tip is nearer. One case to try: put the tip of w on the vertical axis at height one. That number is 𝑖: its length is 1 and its angle is 90 degrees. Multiplying by it turns z a quarter turn and does not stretch it.")}
          </Text>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(f * 100)}
            limit={100}
            what={L("per cent of the move: first the turn, then the stretch")}
            onToggle={() => {
              if (!runner.running && tick >= FRAMES) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many * 8)}
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
                deps={[z, w, f]}
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
                  const unit: [number, number][] = [];
                  for (let i = 0; i <= 120; i++) unit.push([Math.cos((i / 120) * 2 * Math.PI), Math.sin((i / 120) * 2 * Math.PI)]);
                  pen.line(unit, "#2c3540", 1);
                  pen.arrow(0, 0, z[0], z[1], ONE);
                  pen.arrow(0, 0, w[0], w[1], TWO);
                  pen.text(`z = ${show(z)}`, z[0], z[1] + 0.35, ONE, "center");
                  pen.text(`w = ${show(w)}`, w[0], w[1] + 0.35, TWO, "center");
                  if (f > 0) {
                    pen.arrow(0, 0, now[0], now[1], INK);
                    pen.dot(now[0], now[1], 4, INK);
                  }
                  if (f >= 1) {
                    pen.dot(product[0], product[1], 6, SKY);
                    pen.text(`z w = ${show(product)}`, product[0], product[1] - 0.45, SKY, "center");
                  }
                  pen.text(L("Across"), BOX.x1 - 0.8, -0.35, MUTED, "center");
                  pen.text(L("Up"), 0.3, BOX.y1 - 0.5, MUTED, "left");
                }}
              />
            </div>
            <Caption>{L("Arrows from zero, named z and w at their tips. A third arrow appears when run is pressed: it is z on its way to the product, first turning by the angle of w, then stretching by the length of w. At the end a large dot, named z w, marks the product. The thin circle around zero has radius one: multiplying by a number on this circle turns an arrow without stretching it.")}</Caption>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {f === 0
                ? L("z is {{z}}: length {{rz}}, angle {{az}}. w is {{w}}: length {{rw}}, angle {{aw}}. Press run.", { z: show(z), rz: abs(z).toFixed(2), az: deg(turns(z)), w: show(w), rw: abs(w).toFixed(2), aw: deg(turns(w)) })
                : f < 0.5
                  ? L("First move: z turns by the angle of w, {{aw}}. {{p}} per cent of the turn is done. The length has not changed yet.", { aw: deg(turns(w)), p: (turnPart * 100).toFixed(0) })
                  : f < 1
                    ? L("Second move: the turn is done, and the arrow is stretched by the length of w, {{rw}}. It is now {{now}} long.", { rw: abs(w).toFixed(2), now: lengthNow.toFixed(2) })
                    : L("z times w is {{p}}. Length: {{rz}} times {{rw}} = {{rp}}. Angle: {{az}} plus {{aw}} = {{ap}}. Multiplying out the brackets (a + bi)(c + di) gives the same point: {{re}} across and {{im}} up.", {
                        p: show(product),
                        rz: abs(z).toFixed(2),
                        rw: abs(w).toFixed(2),
                        rp: abs(product).toFixed(2),
                        az: deg(turns(z)),
                        aw: deg(turns(w)),
                        ap: deg(turns(product) < turns(z) + turns(w) - 0.5 ? turns(product) + 1 : turns(product)),
                        re: `${z[0]}·${w[0]} - ${z[1]}·${w[1]}`,
                        im: `${z[0]}·${w[1]} + ${z[1]}·${w[0]}`,
                      })}
            </Verdict>
            <Readout
              rows={[
                [L("z: length and angle"), `${abs(z).toFixed(3)}, ${deg(turns(z))}`],
                [L("w: length and angle"), `${abs(w).toFixed(3)}, ${deg(turns(w))}`],
                [L("Product z w: length and angle"), `${abs(product).toFixed(3)}, ${deg(turns(product))}`],
                [L("Length of z times length of w"), (abs(z) * abs(w)).toFixed(3)],
                [L("Angle of z plus angle of w"), deg((turns(z) + turns(w)) % 1)],
                [L("Product worked out from the brackets"), `(${z[0]}·${w[0]} - ${z[1]}·${w[1]}) + (${z[0]}·${w[1]} + ${z[1]}·${w[0]})i = ${show(product)}`],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("Where the minus sign in the brackets comes from: multiplying out (a + bi)(c + di) gives four terms, and one of them contains 𝑖 times 𝑖, which is minus one. That single fact is what makes multiplying a turn and a stretch. Squaring a number means multiplying it by itself: its angle doubles and its length is squared. The page 'Which points stay near zero? The Mandelbrot set', in the same topic, repeats squaring many times.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-multiply" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
