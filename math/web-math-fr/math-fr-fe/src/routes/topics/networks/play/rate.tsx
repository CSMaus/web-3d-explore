import { createFileRoute } from "@tanstack/react-router";
import { Button, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { ticks } from "@/lib/draw";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { MOTIONS, slopeBetween, trace } from "@/systems/calc";
import { L } from "@/lib/lang";

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
    <div>
      <TaskPage
        title={system?.name ?? L("How fast is it going")}
        job={L("How can the speed of a car be found when only its position is known? A car drives along a straight road for 12 seconds. At every moment the page knows how far the car is from the start, in metres, and nothing else. The speed is worked out from two readings of the position, taken a short time apart: the distance covered between them, divided by the time between them. The buttons choose how the car moves. The slider sets the time between the two readings. Press run and compare the speed found this way with the true speed.")}
        input={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {KEYS.map((id) => (
                <Button variant="outline" size="sm"
                  key={id}
                  type="button"
                  onClick={() => {
                    setMotion(id);
                    runner.reset();
                    setTick(0);
                  }}
                  aria-pressed={motion === id}
                >
                  {L(MOTIONS[id].label)}
                </Button>
              ))}
            </div>
            <Text kind="note" as="p">{L(m.what)}</Text>
            <Slider
              label={L("Time between the two readings")}
              min={0.05}
              max={4}
              step={0.05}
              value={gap}
              format={(v) => `${v.toFixed(2)} s`}
              onChange={setGap}
            />
            <Text kind="note" as="p">
              {L("One reading of the position is taken a little before the moment shown and one a little after. The slider sets the time between them, in seconds. The shorter this time, the closer the result comes to the true speed.")}
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
              if (!runner.running && tick >= TICKS) {
                runner.reset();
                setTick(0);
              }
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
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
            <div data-slot="plot" className="h-[110px] overflow-hidden">
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
                  pen.text(started ? `${position.toFixed(1)} m` : L("The car"), position, 0.45, "#a5e3a0", "center");
                }}
              />
            </div>
            <div><div data-slot="plot" className="h-[230px] overflow-hidden">
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
            </div><Caption>{L("Middle picture: the car's distance from the start (up) against time (across). The thick part of the curve is the time already passed, and the large dot is the car now. The two small dots are the two readings, {{gap}} s apart, joined by a straight line. The steeper that line, the faster the car.", { gap: gap.toFixed(2) })}</Caption></div>
            <div><div data-slot="plot" className="h-[190px] overflow-hidden">
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
            </div><Caption>{L("Bottom picture: the car's speed against time. The dot is the true speed at this moment. The ring is the speed worked out from the two readings. When the ring sits on the dot, the two agree.")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={started ? Math.abs(fromTwo - exact) < 0.05 * Math.max(1, Math.abs(exact)) : undefined}>
              {!started
                ? L("Press run and the car sets off. Its speed will be worked out from its positions alone.")
                : L("At {{t}} s the car is {{x}} m from the start, and its true speed is {{v}} m/s. From two positions {{gap}} s apart, the speed comes out as {{est}} m/s, {{judge}}.", {
                    t: t.toFixed(1),
                    x: position.toFixed(1),
                    v: exact.toFixed(2),
                    gap: gap.toFixed(2),
                    est: fromTwo.toFixed(2),
                    judge: Math.abs(fromTwo - exact) < 0.05 * Math.max(1, Math.abs(exact)) ? L("which matches the true speed") : L("which is off: the two readings are too far apart for this motion, and a shorter time between them gives a better result"),
                  })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Distance covered between the two readings")}</dt>
              <dd className="text-right text-foreground/80">{(m.at(tB) - m.at(tA)).toFixed(3)} m</dd>
              <dt>{L("Time between the two readings")}</dt>
              <dd className="text-right text-foreground/80">{(tB - tA).toFixed(3)} s</dd>
              <dt>{L("Speed from the two readings: distance divided by time")}</dt>
              <dd className="text-right text-foreground/80">{fromTwo.toFixed(4)} m/s</dd>
              <dt>{L("True speed at this moment")}</dt>
              <dd className="text-right text-foreground/80">{exact.toFixed(4)} m/s</dd>
              <dt>{L("Difference between the two speeds, in m/s")}</dt>
              <dd className="text-right text-foreground/80">{Math.abs(fromTwo - exact).toExponential(2)}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("A small change in position divided by the short time it took gives the speed. As the time between the two readings shrinks towards zero, the result becomes the speed at one exact moment. This number is called the derivative of the position. The same division, a small change in one quantity over the small change in another, is how a neural network, a program that learns from examples, finds out how to improve.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`rate-${motion}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
