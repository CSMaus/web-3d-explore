import { createFileRoute } from "@tanstack/react-router";
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
import { INK, MUTED, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { abs, mul, show, turns, type C } from "@/systems/complex";
import { ComplexFrame } from "./-shared";

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
    <ComplexFrame>
      <TaskPage
        title={system?.name ?? "A quarter turn, called i"}
        job="Multiplying by minus one is a half turn about zero. The last page asked for a number that does half of that, so that doing it twice is a half turn. Give the line a second direction, up, and a quarter turn is available. The number that turns an arrow by a quarter is written i. The job is to multiply by it again and again and watch what happens."
        input={
          <div className="space-y-3">
            <Slider label="Start, along" min={-2} max={2} step={0.1} value={start[0]} format={(v) => v.toFixed(1)} onChange={(v) => { setStart([v, start[1]]); reset(); }} />
            <Slider label="Start, up" min={-2} max={2} step={0.1} value={start[1]} format={(v) => v.toFixed(1)} onChange={(v) => { setStart([start[0], v]); reset(); }} />
            <p className="text-[11px] text-muted">
              Click the picture to put the starting arrow anywhere. Each step multiplies it by i,
              which turns it a quarter of the way round and leaves its length alone.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={done}
            limit={MOST}
            what="multiplications by i"
            onToggle={() => {
              if (!runner.running && at >= MOST * FRAMES) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(MOST * FRAMES, v + many * FRAMES))}
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
                  pen.text("along", BOX.x1 - 0.5, -0.3, SKY, "center");
                  pen.text("up", 0.25, BOX.y1 - 0.4, TWO, "left");
                }}
              />
            </div>
            <Caption>The plane: the old number line runs along, the new direction runs up. Green: the arrow after the multiplications so far. White: the turn in progress. The grey circle is the arrow's length, which never changes.</Caption>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={done >= 4 ? true : undefined}>
              {done === 0 && within === 0
                ? `The arrow starts at ${show(start)}. Press run: times i, four times.`
                : done < MOST && within > 0
                  ? `Turning: multiplication ${done + 1} is a quarter of the way round, ${(within * 100).toFixed(0)} per cent done.`
                  : `After ${done} multiplication${done === 1 ? "" : "s"} by i the arrow is at ${show(chain[done])}, the same length as it started, turned ${done} quarter${done === 1 ? "" : "s"}. ${done === 2 ? "Two quarter turns is a half turn: the arrow points the opposite way, which is what times minus one does. So i times i is minus one, and the last page's question has its answer." : done === 4 ? "Four quarters is a whole turn: back where it started. Times i four times is times one." : done > 4 ? "Past four it repeats: the pattern is 1, i, minus 1, minus i, and round again." : ""}`}
            </Verdict>
            <Readout
              rows={[
                ["Start", show(start)],
                ["After 1: times i", show(chain[1])],
                ["After 2: times i, twice", `${show(chain[2])}, which is minus the start`],
                ["After 3", show(chain[3])],
                ["After 4", `${show(chain[4])}, the start again`],
                ["Length, throughout", abs(start).toFixed(3)],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              A number is now a place in the plane: so much along, so much up, written a + bi. The
              old numbers are the ones with nothing up. The word imaginary was an insult from the
              seventeenth century that stuck; nothing on the up axis is less real than a length.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-turn" />
            <Equations system={system} />
          </>
        }
      />
    </ComplexFrame>
  );
}
