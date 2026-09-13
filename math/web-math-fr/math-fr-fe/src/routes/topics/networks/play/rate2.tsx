import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { NetTabs } from "@/components/NetTabs";
import { Plot, type Box, type Pen } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO, plate, ticks } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { MOTIONS, secondSlope, slopeBetween, trace } from "@/systems/calc";

export const Route = createFileRoute("/topics/networks/play/rate2")({
  loader: () => api.system(TOPIC, "rate2"),
  component: Rate2Page,
});

const T_END = 12;
const TICKS = 240;
const OPTIONS = Object.keys(MOTIONS).map((id) => ({ id, label: MOTIONS[id].label }));

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

  const trend = Math.abs(exactAccel) < 0.05 ? "Holding steady" : exactAccel > 0 ? "Getting faster" : "Getting slower";

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "Is it speeding up or slowing down"}
        job="The same car. Last page the job was its speed. This time the job is whether the speed itself is rising or falling, and by how much a second: the acceleration. It comes from the speed exactly the way the speed came from the position."
        input={
          <div className="space-y-3">
            <Choices options={OPTIONS} value={motion} onPick={(id) => { setMotion(id); reset(); }} />
            <p className="text-[11px] text-muted">{m.what}</p>
            <Slider label="The gap" min={0.05} max={3} step={0.05} value={gap} format={(v) => `${v.toFixed(2)} s`} onChange={setGap} />
            <p className="text-[11px] text-muted">
              The acceleration is read from two speeds this far apart, and each of those speeds is
              read from two positions this far apart. So it is a change of a change. A wide gap
              blurs it twice over; pinch it down and the ring settles on the dot.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(t * 10) / 10}
            what="seconds"
            limit={T_END}
            onToggle={() => {
              if (!runner.running && tick >= TICKS) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(TICKS, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div className="h-[120px] overflow-hidden rounded border border-edge">
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
            </div><Caption>{started ? `Speed ${speed.toFixed(1)} m/s` : "Green arrow: the speed"}. {started ? `Acceleration ${exactAccel.toFixed(2)} m/s each second` : "Rose arrow: how the speed is changing"}</Caption></div>
            <div className="h-[150px] overflow-hidden rounded border border-edge">
              <Plot className="h-full w-full" box={posBox} deps={[posTrace, t, posBox]} draw={(pen) => {
                ticks(pen);
                curve(pen, posTrace, ONE, "#243a2c");
                pen.dot(t, position, 5, INK);
                plate(pen, "Where the car is", posBox.x0 + 0.3, posBox.y1 - (posBox.y1 - posBox.y0) * 0.1, MUTED);
              }} />
            </div>
            <div><div className="h-[150px] overflow-hidden rounded border border-edge">
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
            </div><Caption>The speed. Its steepness is the acceleration.</Caption></div>
            <div><div className="h-[150px] overflow-hidden rounded border border-edge">
              <Plot className="h-full w-full" box={accBox} deps={[accTrace, t, accel, accBox]} draw={(pen) => {
                ticks(pen);
                curve(pen, accTrace, TWO, "#3a2033");
                pen.dot(t, exactAccel, 4.5, TWO);
                pen.ring(t, accel, 6, INK, 2);
              }} />
            </div><Caption>The acceleration. Above zero: speeding up. Below: slowing down. Ring: from the gap you set.  Dot: exact.</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={started ? Math.abs(accel - exactAccel) < 0.08 * Math.max(0.5, Math.abs(exactAccel)) : undefined}>
              {!started
                ? "Press run. The green arrow will be the speed and the rose arrow the change in it. Watch the rose arrow point backwards whenever the green one is shrinking."
                : `At ${t.toFixed(1)} s the car is ${trend}: its speed is ${speed.toFixed(2)} m/s and changing by ${exactAccel.toFixed(2)} m/s every second. From two speeds ${gap.toFixed(2)} s apart the change comes out as ${accel.toFixed(2)}, ${Math.abs(accel - exactAccel) < 0.08 * Math.max(0.5, Math.abs(exactAccel)) ? "which is right" : "which is off: the gap is too wide for a speed that swings this fast"}.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Speed a little before</dt>
              <dd className="text-right text-ink/80">{slopeBetween(m.at, t - gap / 2, gap).toFixed(3)} M/s</dd>
              <dt>Speed a little after</dt>
              <dd className="text-right text-ink/80">{slopeBetween(m.at, t + gap / 2, gap).toFixed(3)} M/s</dd>
              <dt>The difference, divided by the gap</dt>
              <dd className="text-right text-ink/80">{accel.toFixed(3)} M/s each second</dd>
              <dt>Exact</dt>
              <dd className="text-right text-ink/80">{exactAccel.toFixed(3)}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              Position, speed, acceleration: each is the steepness of the one before. The same
              ratio, applied twice. A network's training uses exactly this ratio, once, on a
              different kind of curve: how wrong it is, against each of its own numbers.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`rate2-${motion}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}

const EDGE_ROAD = "#39414c";
