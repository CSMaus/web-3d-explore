import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/complex";
import { L } from "@/lib/lang";
import { INK, MUTED, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { abs, mul, show, turns, type C } from "@/systems/complex";

export const Route = createFileRoute("/topics/complex/play/turn")({
  loader: () => api.system(TOPIC, "turn"),
  component: TurnPage,
});

const BOX: Box = { x0: -2.6, x1: 2.6, y0: -2.6, y1: 2.6 };
const I: C = [0, 1];
const FRAMES = 30;
const MOST = 8;

function TurnPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [start, setStart] = useState<C>([2, 0]);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(1);

  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: MOST * FRAMES });
  const at = Math.min(tick, MOST * FRAMES);
  const done = Math.floor(at / FRAMES);
  const within = (at % FRAMES) / FRAMES;
  const chain = useMemo(() => {
    const out: C[] = [start];
    for (let i = 0; i < MOST; i++) out.push(mul(out[out.length - 1], I));
    return out;
  }, [start]);
  // the arrow between two multiplications turns smoothly, so the quarter turn is seen as a turn
  const now: C = useMemo(() => {
    if (done >= MOST) return chain[MOST];
    const a = turns(chain[done]) + within * 0.25;
    const r = abs(start);
    return [r * Math.cos(2 * Math.PI * a), r * Math.sin(2 * Math.PI * a)];
  }, [chain, done, within, start]);
  const reset = () => {
    runner.reset();
    setTick(0);
  };

  return (
    <>
      <TaskPage
        title={system?.name ?? L("What 𝑖 is")}
        job={L("Which number, multiplied by itself, gives minus one? No number on the ordinary number line does. Multiplying by minus one sends 2 to minus 2. Drawn as an arrow from zero, the arrow turns half way round. A number that turns an arrow a quarter of the way round would answer the question, because two quarter turns make a half turn. A quarter turn needs a second direction, so the picture has two axes: across and up. The number that turns every arrow a quarter turn anticlockwise, without changing its length, is written 𝑖. Pressing run multiplies the arrow by 𝑖 again and again. The thing to watch: where the arrow points after two multiplications.")}
        input={
          <div className="space-y-3">
            <Slider label={L("Starting point, across")} min={-2} max={2} step={0.1} value={start[0]} format={(v) => v.toFixed(1)} onChange={(v) => { setStart([v, start[1]]); reset(); }} />
            <Slider label={L("Starting point, up")} min={-2} max={2} step={0.1} value={start[1]} format={(v) => v.toFixed(1)} onChange={(v) => { setStart([start[0], v]); reset(); }} />
            <Text kind="note" as="p">
              {L("A point of the plane is written a + bi: a is how far across, b is how far up. For example, 2 + 3i is 2 across and 3 up. The two sliders set the starting point this way, and a click on the picture puts it where the click lands. Each step multiplies the arrow by 𝑖: the arrow turns a quarter turn anticlockwise about zero, and its length stays the same.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={done}
            limit={MOST}
            what={L("multiplications by 𝑖")}
            onToggle={() => {
              if (!runner.running && at >= MOST * FRAMES) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many * FRAMES)}
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
                deps={[chain, now, done]}
                onPick={(x, y) => {
                  setStart([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
                  reset();
                }}
                draw={(pen) => {
                  ticks(pen, { x: 1, y: 1 });
                  pen.axes("#3a4048");
                  const r = abs(start);
                  const ring: [number, number][] = [];
                  for (let i = 0; i <= 120; i++) ring.push([r * Math.cos((i / 120) * 2 * Math.PI), r * Math.sin((i / 120) * 2 * Math.PI)]);
                  pen.line(ring, "#2c3540", 1);
                  for (let k = 0; k <= Math.min(done, MOST); k++) {
                    const z = chain[k];
                    pen.arrow(0, 0, z[0], z[1], k === done ? ONE : "#3a4a3c");
                    pen.dot(z[0], z[1], 3, k === done ? ONE : "#3a4a3c");
                    if (k < 4) pen.text(show(z), z[0] * 1.15, z[1] * 1.15 + 0.1, k === done ? ONE : MUTED, "center");
                  }
                  if (done < MOST && within > 0) {
                    pen.arrow(0, 0, now[0], now[1], INK);
                    pen.dot(now[0], now[1], 4, INK);
                  }
                  pen.text(L("Across"), BOX.x1 - 0.5, -0.3, SKY, "center");
                  pen.text(L("Up"), 0.25, BOX.y1 - 0.4, TWO, "left");
                }}
              />
            </div>
            <Caption>{L("The plane of numbers. The horizontal axis is the ordinary number line; the vertical axis is the new direction, up. Every arrow starts at zero. Each multiplication leaves its arrow drawn, so the arrows after one, two, three and four steps can be compared. During a step, a moving arrow shows the turn in progress. The thin circle around zero has the arrow's length as its radius: the tip never leaves it.")}</Caption>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={done >= 4 ? true : undefined}>
              {done === 0 && within === 0
                ? L("The arrow starts at {{z}}. Press run: the arrow is multiplied by 𝑖, one step at a time.", { z: show(start) })
                : done < MOST && within > 0
                  ? L("Multiplication number {{n}} by 𝑖 is under way: the arrow has done {{p}} per cent of its quarter turn.", { n: done + 1, p: (within * 100).toFixed(0) })
                  : (done === 1
                      ? L("After {{n}} multiplication by 𝑖 the arrow points to {{z}}. It has turned {{n}} quarter turn and kept its length. {{more}}", { n: done, z: show(chain[done]), more: "" })
                      : L("After {{n}} multiplications by 𝑖 the arrow points to {{z}}. It has turned {{n}} quarter turns and kept its length. {{more}}", {
                          n: done,
                          z: show(chain[done]),
                          more: done === 2 ? L("Two quarter turns make a half turn: the arrow now points the opposite way, which is exactly what multiplying by minus one does. So 𝑖 times 𝑖 is minus one. This is the number that no point of the ordinary number line could be.") : done === 4 ? L("Four quarter turns make a whole turn: the arrow is back where it started. Multiplying by 𝑖 four times is the same as multiplying by one.") : done > 4 ? L("After four steps the pattern repeats. Starting from 1, the results are 1, 𝑖, minus 1, minus 𝑖, then 1 and round again.") : "",
                        }))}
            </Verdict>
            <Readout
              rows={[
                [L("Starting point"), show(start)],
                [L("After 1 multiplication by 𝑖"), show(chain[1])],
                [L("After 2 multiplications"), L("{{z}}: the starting point times minus one", { z: show(chain[2]) })],
                [L("After 3 multiplications"), show(chain[3])],
                [L("After 4 multiplications"), L("{{z}}: the starting point again", { z: show(chain[4]) })],
                [L("Length of the arrow, at every step"), abs(start).toFixed(3)],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("Every point of the plane is now a number, written a + bi: a is how far across, b is how far up. Such numbers are called complex numbers. The ordinary numbers are the ones with b equal to zero: the points of the horizontal axis. The numbers on the vertical axis are called imaginary. The name was given in the seventeenth century as mockery, and it stayed. A number on the vertical axis is no less real than a length.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-turn" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
