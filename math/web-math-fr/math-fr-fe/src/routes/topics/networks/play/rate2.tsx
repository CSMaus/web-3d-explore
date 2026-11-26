import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box, type Pen } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO, plate, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { MOTIONS, secondSlope, slopeBetween, trace } from "@/systems/calc";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/networks/play/rate2")({
  loader: () => api.system(TOPIC, "rate2"),
  component: Rate2Page,
});

const T_END = 12;
const TICKS = 240;
const OPTIONS = Object.keys(MOTIONS).map((id) => ({ id, label: L(MOTIONS[id].label) }));

function fit(pts: [number, number][], padFrac: number, zero = false): Box {
  const ys = pts.map((p) => p[1]);
  const lo = zero ? Math.min(0, ...ys) : Math.min(...ys);
  const hi = zero ? Math.max(0, ...ys) : Math.max(...ys);
  const pad = (hi - lo) * padFrac || 1;
  return { x0: -0.3, x1: T_END + 0.3, y0: lo - pad, y1: hi + pad };
}

function Rate2Page() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [motion, setMotion] = useState("bumpy");
  const [gap, setGap] = useState(0.4);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(1);

  const m = MOTIONS[motion];
  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: TICKS });
  const t = (Math.min(tick, TICKS) / TICKS) * T_END;
  const started = tick > 0;

  const position = m.at(t);
  const speed = m.speed(t);
  // the exact acceleration is the derivative of the exact speed, taken with a
  // gap far below anything the reader can set
  const exactAccel = slopeBetween(m.speed, t, 1e-4);
  const accel = secondSlope(m.at, t, gap);

  const posTrace = useMemo(() => trace(m.at, 0, T_END), [m]);
  const spdTrace = useMemo(() => trace(m.speed, 0, T_END), [m]);
  const accTrace = useMemo(() => trace((s) => slopeBetween(m.speed, s, 1e-4), 0, T_END), [m]);
  const posBox = useMemo(() => fit(posTrace, 0.15), [posTrace]);
  const spdBox = useMemo(() => fit(spdTrace, 0.2, true), [spdTrace]);
  const accBox = useMemo(() => fit(accTrace, 0.25, true), [accTrace]);
  const roadBox = useMemo<Box>(() => {
    const ys = posTrace.map((p) => p[1]);
    return { x0: Math.min(...ys) - 3, x1: Math.max(...ys) + 3, y0: -1, y1: 1 };
  }, [posTrace]);

  const reset = () => {
    runner.reset();
    setTick(0);
  };

  const curve = (pen: Pen, pts: [number, number][], colour: string, dark: string) => {
    pen.axes(FAINT);
    pen.line(pts.filter((p) => p[0] <= t), colour, 2.2);
    pen.line(pts.filter((p) => p[0] >= t), dark, 1);
  };

  const trend = Math.abs(exactAccel) < 0.05 ? L("keeping a steady speed") : exactAccel > 0 ? L("speeding up") : L("slowing down");

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("Is it speeding up or slowing down")}
        job={L("Is the car speeding up or slowing down, and by how much? A car drives along a road for 12 seconds, and only its position is known at each moment. Speed is the distance covered divided by the time it took. Acceleration is how much the speed changes in one second, measured in metres per second each second. Here it is found in two stages. First two speeds are worked out, one a little before the moment and one a little after, each from two positions. Then their difference is divided by the time between them. The buttons choose how the car moves, and the slider sets the time between the readings. Press run and compare the result with the true acceleration.")}
        input={
          <div className="space-y-3">
            <Choices options={OPTIONS} value={motion} onPick={(id) => { setMotion(id); reset(); }} />
            <Text kind="note" as="p">{L(m.what)}</Text>
            <Slider label={L("Time between the two readings")} min={0.05} max={3} step={0.05} value={gap} format={(v) => `${v.toFixed(2)} s`} onChange={setGap} />
            <Text kind="note" as="p">
              {L("The acceleration is found from two speeds read this far apart in time. Each of those speeds is itself found from two positions this far apart. So the result is a change of a change. A long time between the readings blurs the result twice. A short time brings the ring in the bottom picture onto the dot.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(t * 10) / 10}
            what={L("seconds")}
            limit={T_END}
            onToggle={() => {
              if (!runner.running && tick >= TICKS) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div data-slot="plot" className="h-[120px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={roadBox}
                deps={[position, speed, exactAccel, roadBox]}
                draw={(pen) => {
                                    pen.line([[roadBox.x0, 0], [roadBox.x1, 0]], EDGE_ROAD, 3);
                  for (let x = Math.ceil(roadBox.x0 / 10) * 10; x <= roadBox.x1; x += 10) {
                    pen.line([[x, -0.12], [x, 0.12]], MUTED, 1);
                    pen.text(`${x} m`, x, -0.6, MUTED, "center");
                  }
                  // the speed as an arrow along the road, the acceleration as a second one above it
                  const scale = (roadBox.x1 - roadBox.x0) / 60;
                  pen.arrow(position, 0.3, speed * scale, 0, ONE);
                  pen.arrow(position, 0.62, exactAccel * scale * 2, 0, TWO);
                  pen.dot(position, 0, 9, ONE);
                }}
              />
            </div><Caption>{L("Top picture: the car on the road. The lower arrow is its speed. The upper arrow is its acceleration: it points forward while the car speeds up and backward while it slows down.")}{started ? " " + L("Speed {{v}} m/s, acceleration {{a}} m/s each second.", { v: speed.toFixed(1), a: exactAccel.toFixed(2) }) : ""}</Caption></div>
            <div data-slot="plot" className="h-[150px] overflow-hidden">
              <Plot className="h-full w-full" box={posBox} deps={[posTrace, t, posBox]} draw={(pen) => {
                ticks(pen);
                curve(pen, posTrace, ONE, "#243a2c");
                pen.dot(t, position, 5, INK);
                plate(pen, L("Distance from the start, against time"), posBox.x0 + 0.3, posBox.y1 - (posBox.y1 - posBox.y0) * 0.1, MUTED);
              }} />
            </div>
            <div><div data-slot="plot" className="h-[150px] overflow-hidden">
              <Plot className="h-full w-full" box={spdBox} deps={[spdTrace, t, gap, spdBox]} draw={(pen) => {
                ticks(pen);
                curve(pen, spdTrace, SKY, "#20323a");
                // the two speeds the acceleration is read from, and the line through them
                const a: [number, number] = [t - gap / 2, slopeBetween(m.at, t - gap / 2, gap)];
                const b: [number, number] = [t + gap / 2, slopeBetween(m.at, t + gap / 2, gap)];
                pen.line([a, b], TWO, 1.6);
                pen.dot(a[0], a[1], 4, TWO);
                pen.dot(b[0], b[1], 4, TWO);
                pen.dot(t, speed, 5, INK);
              }} />
            </div><Caption>{L("Third picture: the speed against time. The short straight line joins the two speeds the acceleration is worked out from. Its steepness is the acceleration.")}</Caption></div>
            <div><div data-slot="plot" className="h-[150px] overflow-hidden">
              <Plot className="h-full w-full" box={accBox} deps={[accTrace, t, accel, accBox]} draw={(pen) => {
                ticks(pen);
                curve(pen, accTrace, TWO, "#3a2033");
                pen.dot(t, exactAccel, 4.5, TWO);
                pen.ring(t, accel, 6, INK, 2);
              }} />
            </div><Caption>{L("Bottom picture: the acceleration against time. Above zero the car speeds up, below zero it slows down. The dot is the true acceleration. The ring is the acceleration worked out from the readings.")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={started ? Math.abs(accel - exactAccel) < 0.08 * Math.max(0.5, Math.abs(exactAccel)) : undefined}>
              {!started
                ? L("Press run and the car sets off. Watch the upper arrow: whenever the speed is falling, it points backwards, even while the car still moves forward.")
                : L("At {{t}} s the car is {{trend}}. Its speed is {{v}} m/s and changes by {{a}} m/s every second. From two speeds {{gap}} s apart, the change comes out as {{est}} m/s each second, {{judge}}.", {
                    t: t.toFixed(1),
                    trend,
                    v: speed.toFixed(2),
                    a: exactAccel.toFixed(2),
                    gap: gap.toFixed(2),
                    est: accel.toFixed(2),
                    judge: Math.abs(accel - exactAccel) < 0.08 * Math.max(0.5, Math.abs(exactAccel)) ? L("which matches the true acceleration") : L("which is off: the readings are too far apart for a speed that swings this fast"),
                  })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Speed read shortly before this moment")}</dt>
              <dd className="text-right text-foreground/80">{slopeBetween(m.at, t - gap / 2, gap).toFixed(3)} m/s</dd>
              <dt>{L("Speed read shortly after this moment")}</dt>
              <dd className="text-right text-foreground/80">{slopeBetween(m.at, t + gap / 2, gap).toFixed(3)} m/s</dd>
              <dt>{L("Acceleration from the readings: their difference divided by the time between them")}</dt>
              <dd className="text-right text-foreground/80">{L("{{a}} m/s each second", { a: accel.toFixed(3) })}</dd>
              <dt>{L("True acceleration")}</dt>
              <dd className="text-right text-foreground/80">{L("{{a}} m/s each second", { a: exactAccel.toFixed(3) })}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("Position, speed, acceleration: each one says how fast the one before it changes. The same division, a small change over a short time, is used twice. A neural network, a program that learns from examples, uses this division while it learns: it measures how its error changes when one of its own numbers changes a little.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`rate2-${motion}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}

const EDGE_ROAD = "#39414c";
