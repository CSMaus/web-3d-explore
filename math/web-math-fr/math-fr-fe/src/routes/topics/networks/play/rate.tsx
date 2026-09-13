import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { NetTabs } from "@/components/NetTabs";
import { Plot, type Box } from "@/components/Plot";
import { ticks } from "@/lib/draw";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { MOTIONS, slopeBetween, trace } from "@/systems/calc";

export const Route = createFileRoute("/topics/networks/play/rate")({
  loader: () => api.system(TOPIC, "rate"),
  component: RatePage,
});

const T_END = 12;
const TICKS = 240;
const KEYS = Object.keys(MOTIONS);

function RatePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [motion, setMotion] = useState("braking");
  const [gap, setGap] = useState(2);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(1);

  const m = MOTIONS[motion];
  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: TICKS });
  const t = (Math.min(tick, TICKS) / TICKS) * T_END;

  const position = m.at(t);
  const exact = m.speed(t);
  const fromTwo = slopeBetween(m.at, t, gap);
  const tA = Math.max(0, t - gap / 2);
  const tB = Math.min(T_END, t + gap / 2);

  const posTrace = useMemo(() => trace(m.at, 0, T_END), [m]);
  const spdTrace = useMemo(() => trace(m.speed, 0, T_END), [m]);
  const posBox = useMemo<Box>(() => {
    const ys = posTrace.map((p) => p[1]);
    const pad = (Math.max(...ys) - Math.min(...ys)) * 0.15 || 1;
    return { x0: -0.3, x1: T_END + 0.3, y0: Math.min(...ys) - pad, y1: Math.max(...ys) + pad };
  }, [posTrace]);
  const spdBox = useMemo<Box>(() => {
    const ys = spdTrace.map((p) => p[1]);
    const pad = (Math.max(...ys) - Math.min(...ys)) * 0.2 || 1;
    return { x0: -0.3, x1: T_END + 0.3, y0: Math.min(0, ...ys) - pad, y1: Math.max(0, ...ys) + pad };
  }, [spdTrace]);

  const roadBox: Box = useMemo(() => {
    const ys = posTrace.map((p) => p[1]);
    return { x0: Math.min(...ys) - 3, x1: Math.max(...ys) + 3, y0: -1, y1: 1 };
  }, [posTrace]);

  const started = tick > 0;

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "How fast is it going"}
        job="A car drives along a road. You can see where it is at every moment. The job is to say how fast it is going, using nothing but where it is."
        input={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {KEYS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMotion(id);
                    runner.reset();
                    setTick(0);
                  }}
                  aria-pressed={motion === id}
                  className={
                    motion === id
                      ? "rounded border border-leaf px-2.5 py-1 font-mono text-[11px] text-leaf"
                      : "rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-muted"
                  }
                >
                  {MOTIONS[id].label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted">{m.what}</p>
            <Slider
              label="The gap"
              min={0.05}
              max={4}
              step={0.05}
              value={gap}
              format={(v) => `${v.toFixed(2)} s`}
              onChange={setGap}
            />
            <p className="text-[11px] text-muted">
              The gap is how far apart the two positions are that the speed is worked out from.
              Pinch it down and watch the number from two positions settle on the true speed.
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
              if (!runner.running && tick >= TICKS) {
                runner.reset();
                setTick(0);
              }
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(TICKS, v + many))}
            onReset={() => {
              runner.reset();
              setTick(0);
            }}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="h-[110px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={roadBox}
                deps={[position, roadBox]}
                draw={(pen) => {
                                    pen.line([[roadBox.x0, 0], [roadBox.x1, 0]], "#39414c", 3);
                  for (let x = Math.ceil(roadBox.x0 / 10) * 10; x <= roadBox.x1; x += 10) {
                    pen.line([[x, -0.12], [x, 0.12]], "#5b616b", 1);
                    pen.text(`${x} m`, x, -0.55, "#5b616b", "center");
                  }
                  pen.dot(position, 0.02, 9, "#a5e3a0");
                  pen.text(started ? `${position.toFixed(1)} m` : "The road", position, 0.45, "#a5e3a0", "center");
                }}
              />
            </div>
            <div><div className="h-[230px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={posBox}
                deps={[posTrace, t, gap, posBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes("#23262c");
                  pen.line(posTrace.filter((p) => p[0] <= t), "#a5e3a0", 2.2);
                  pen.line(posTrace.filter((p) => p[0] >= t), "#243a2c", 1);
                  // the two positions the speed is read from, and the line through them
                  const a: [number, number] = [tA, m.at(tA)];
                  const b: [number, number] = [tB, m.at(tB)];
                  pen.line([a, b], "#c75ab0", 1.6);
                  const ext = 3;
                  const s = fromTwo;
                  pen.line([[tA - ext, m.at(tA) - s * ext], [tB + ext, m.at(tB) + s * ext]], "#c75ab033", 1);
                  pen.dot(a[0], a[1], 4, "#c75ab0");
                  pen.dot(b[0], b[1], 4, "#c75ab0");
                  pen.dot(t, position, 5, "#e8e8ea");
                }}
              />
            </div><Caption>Where the car is, against time. {`The line through two positions ${gap.toFixed(2)} s apart. Its steepness is the speed.`}</Caption></div>
            <div><div className="h-[190px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={spdBox}
                deps={[spdTrace, t, fromTwo, spdBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes("#23262c");
                  pen.line(spdTrace.filter((p) => p[0] <= t), "#8fd3e8", 2.2);
                  pen.line(spdTrace.filter((p) => p[0] >= t), "#20323a", 1);
                  pen.dot(t, exact, 4.5, "#8fd3e8");
                  pen.ring(t, fromTwo, 6, "#c75ab0", 2);
                }}
              />
            </div><Caption>The speed, against time: the steepness of the curve above, at every moment Ring: from two positions.  Dot: exact.</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={started ? Math.abs(fromTwo - exact) < 0.05 * Math.max(1, Math.abs(exact)) : undefined}>
              {!started
                ? "Press run and the car sets off. The speed will be read from where it is, and only from where it is."
                : `At ${t.toFixed(1)} s the car is at ${position.toFixed(1)} m and going ${exact.toFixed(2)} m/s. From two positions ${gap.toFixed(2)} s apart, the speed comes out as ${fromTwo.toFixed(2)} m/s, ${Math.abs(fromTwo - exact) < 0.05 * Math.max(1, Math.abs(exact)) ? "which is right" : "which is off, because the gap is too wide for a curve that bends this much"}.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Moved between the two positions</dt>
              <dd className="text-right text-ink/80">{(m.at(tB) - m.at(tA)).toFixed(3)} m</dd>
              <dt>In</dt>
              <dd className="text-right text-ink/80">{(tB - tA).toFixed(3)} s</dd>
              <dt>So the speed is that divided by this</dt>
              <dd className="text-right text-ink/80">{fromTwo.toFixed(4)} M/s</dd>
              <dt>The exact speed at this instant</dt>
              <dd className="text-right text-ink/80">{exact.toFixed(4)} M/s</dd>
              <dt>The gap between the two answers</dt>
              <dd className="text-right text-ink/80">{Math.abs(fromTwo - exact).toExponential(2)}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              That is the whole of a derivative: a change in one thing divided by the change in
              another, with the gap made as small as you like. Every page after this one uses it.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`rate-${motion}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
