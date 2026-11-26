import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Orbit3 } from "@/components/Orbit3";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/complex";
import { L } from "@/lib/lang";
import { EDGE, INK, MUTED, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import type { Path } from "@/systems/flow";
import { HOUSE, fromAxisAngle, rotate, show, unit, type Q, type V3 } from "@/systems/quaternion";

export const Route = createFileRoute("/topics/complex/play/quaternions")({
  loader: () => api.system(TOPIC, "quaternions"),
  component: QuaternionsPage,
});

/** the run goes from no turn to the whole angle in this many steps */
const FRAMES = 60;
const REACH = 1.7;
/** the corner of the house that leaves a trail: the right end of the roof ridge */
const MARK = 17;
/** the chart of the four numbers: the whole angle along, minus one to one up */
const HALF_BOX: Box = { x0: 0, x1: 360, y0: -1.05, y1: 1.05 };
const AXES: { id: string; label: string; axis: V3; said: string }[] = [
  { id: "i", label: L("About 𝑖: the horizontal axis"), axis: [1, 0, 0], said: "𝑖" },
  { id: "j", label: L("About 𝑗: the vertical axis"), axis: [0, 1, 0], said: "𝑗" },
  { id: "k", label: L("About 𝑘: the axis out of the screen"), axis: [0, 0, 1], said: "𝑘" },
  { id: "d", label: L("About the diagonal: all three axes at once"), axis: [1, 1, 1], said: L("the diagonal") },
];

function pathOf(points: V3[]): Path {
  const xs = new Float64Array(points.length * 3);
  points.forEach((p, i) => {
    xs[i * 3] = p[0];
    xs[i * 3 + 1] = p[1];
    xs[i * 3 + 2] = p[2];
  });
  return { xs, dim: 3, count: points.length, dt: 1 };
}

const AXIS_PATHS: Path[] = [
  pathOf([[0, 0, 0], [REACH, 0, 0]]),
  pathOf([[0, 0, 0], [0, REACH, 0]]),
  pathOf([[0, 0, 0], [0, 0, REACH]]),
  // the far corners, so the frame keeps its size whatever the house does
  pathOf([[-REACH, -REACH, -REACH], [-REACH, -REACH, -REACH]]),
];

/** the unit vector along an axis */
function along(axis: V3): V3 {
  const l = Math.hypot(axis[0], axis[1], axis[2]);
  return [axis[0] / l, axis[1] / l, axis[2] / l];
}

/**
 * the seventh page of the topic: what a quaternion is, seen. one imaginary unit
 * turned the plane; space has three axes to turn about, so three units, and a
 * turn in space is four numbers, one for how far and three for the axis. the
 * reader picks the axis and the angle, the run turns the house step by step,
 * and the four numbers that do it are read off as they grow.
 */
function QuaternionsPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);
  const [axisId, setAxisId] = useState("j");
  const [angle, setAngle] = useState(90);
  const [aim, setAim] = useState({ azimuth: 0.7, elevation: 0.45 });
  const [zoom, setZoom] = useState(1);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(0.5);

  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: FRAMES });
  const at = Math.min(tick, FRAMES);
  const f = at / FRAMES;
  const chosen = AXES.find((a) => a.id === axisId)!;
  const axis = useMemo(() => along(chosen.axis), [chosen]);
  const turned = angle * f;
  const q: Q = useMemo(() => fromAxisAngle(axis, (turned * Math.PI) / 180), [axis, turned]);
  const whole: Q = useMemo(() => fromAxisAngle(axis, (angle * Math.PI) / 180), [axis, angle]);
  const house = useMemo(() => pathOf(HOUSE.map((p) => rotate(q, p))), [q]);
  // the trail of the marked corner, one point a step done so far
  const trail = useMemo(() => {
    const points: V3[] = [];
    for (let s = 0; s <= at; s++) points.push(rotate(fromAxisAngle(axis, ((angle * s) / FRAMES) * (Math.PI / 180)), HOUSE[MARK]));
    return pathOf(points.length > 1 ? points : [HOUSE[MARK], HOUSE[MARK]]);
  }, [axis, angle, at]);
  const axisLine = useMemo(() => pathOf([[-axis[0] * REACH, -axis[1] * REACH, -axis[2] * REACH], [axis[0] * REACH, axis[1] * REACH, axis[2] * REACH]]), [axis]);
  const before = HOUSE[MARK];
  const after = rotate(q, before);
  const half = turned / 2;
  const colours = [SKY, ONE, TWO, palette.back, INK, "#e8e8ea", INK];
  const v3 = (v: V3) => `(${v.map((x) => x.toFixed(2)).join(", ")})`;
  const reset = () => {
    runner.reset();
    setTick(0);
  };

  return (
    <>
      <TaskPage
        title={system?.name ?? L("Quaternions: turns in space")}
        job={L("How can a turn in three-dimensional space be written as numbers? In a flat plane one extra number, 𝑖, is enough: multiplying by 𝑖 turns an arrow a quarter turn. Space has three directions, across, up and out of the screen, and an object can turn about an axis in any direction. In 1843 William Rowan Hamilton found that space needs three such units, written 𝑖, 𝑗 and 𝑘. A number made of an ordinary part and these three parts is called a quaternion. A turn in space is then written with four numbers: the first says how far to turn, the other three give the axis. The controls choose an axis and an angle. Pressing run turns a small house about that axis step by step, and the four numbers of the turn are shown as they change.")}
        input={
          <div className="space-y-3">
            <Text kind="note" as="p">{L("The axis of the turn")}</Text>
            <Choices options={AXES} value={axisId} onPick={(id) => { setAxisId(id); reset(); }} />
            <Slider label={L("Angle of the turn")} min={0} max={360} step={5} value={angle} format={(v) => L("{{n}} deg", { n: v })} onChange={(v) => { setAngle(Math.round(v / 5) * 5); reset(); }} />
            <Text kind="note" as="p">
              {L("Three short lines from the centre show the axes: 𝑖 points across, 𝑗 points up, 𝑘 points out of the screen. A long line through the house is the chosen axis. As the house turns, the right-hand end of its roof leaves a trail: a circle around the axis. Every turn in space moves points round circles like this one. Dragging the picture changes the viewpoint; the mouse wheel brings it closer.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            limit={FRAMES}
            what={L("steps of the turn")}
            pace="slow"
            onToggle={() => {
              if (!runner.running && at >= FRAMES) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage}>
            <div data-slot="plot" className="h-[min(520px,calc(100vh-20rem))] overflow-hidden">
              <Orbit3
                className="h-full w-full"
                paths={[...AXIS_PATHS, axisLine, trail, house]}
                colours={colours}
                back={palette.back}
                turning={false}
                azimuth={aim.azimuth}
                elevation={aim.elevation}
                zoom={zoom}
                period={40}
                version={at}
                onAim={(a, e) => setAim({ azimuth: a, elevation: e })}
                onZoom={setZoom}
              />
            </div>
            <Caption>
              {L("The house, turned so far by {{a}} deg about {{axis}}. Three short lines from the centre: the axes 𝑖 (across), 𝑗 (up) and 𝑘 (out of the screen). The long line through the house: the chosen axis. The trail: the path of the right-hand end of the roof, a circle around that axis.", { a: turned.toFixed(0), axis: chosen.said })}
            </Caption>
            <div data-slot="plot" className="mt-3 h-[180px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={HALF_BOX}
                deps={[turned, angle]}
                draw={(pen) => {
                  ticks(pen, { x: 90, y: 0.5 });
                  pen.axes(EDGE);
                  const cosine: [number, number][] = [];
                  const sine: [number, number][] = [];
                  for (let d = 0; d <= 360; d += 3) {
                    cosine.push([d, Math.cos((d * Math.PI) / 360)]);
                    sine.push([d, Math.sin((d * Math.PI) / 360)]);
                  }
                  pen.line(cosine, ONE, 1.5);
                  pen.line(sine, TWO, 1.5);
                  pen.line([[angle, -1], [angle, 1]], MUTED, 1);
                  pen.dot(turned, Math.cos((turned * Math.PI) / 360), 4, ONE);
                  pen.dot(turned, Math.sin((turned * Math.PI) / 360), 4, TWO);
                  pen.text(L("Angle turned, deg"), 350, -0.9, MUTED, "right");
                }}
              />
            </div>
            <Caption>
              {L("The four numbers of the turn against the angle turned, from 0 to 360 degrees along the bottom. The cosine and the sine of an angle say how far across and how far up a point lies when it is turned by that angle on a circle of radius one. The curve that starts at one and falls is the first number: the cosine of half the angle. The curve that starts at zero and rises is the size of the other three: the sine of half the angle. The two dots mark where the run is now; the thin vertical line marks the angle chosen.")}
            </Caption>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at >= FRAMES ? true : undefined}>
              {at === 0
                ? L("The house has not turned yet. Press run: it turns {{a}} deg about {{axis}}, one step at a time, and the four numbers of the turn are shown as it goes.", { a: angle, axis: chosen.said })
                : at < FRAMES
                  ? L("Turned so far by {{a}} deg about {{axis}}. The quaternion of this turn is {{q}}. Its first number is the cosine of half the angle, and half the angle is {{h}} deg. The other three are the sine of half the angle, shared out along the axis.", { a: turned.toFixed(0), axis: chosen.said, q: show(q), h: half.toFixed(0) })
                  : L("Turned by {{a}} deg about {{axis}}. The four numbers of this turn: {{q}}. They are built from half the angle, {{h}} deg. A turn in a flat plane is written with the whole angle, because there is only one way to turn there and no axis to choose. {{more}}", {
                      a: angle,
                      axis: chosen.said,
                      q: show(whole),
                      h: (angle / 2).toFixed(0),
                      more: axisId === "k" ? L("About 𝑘, the axis out of the screen, the house turns within the flat plane of the screen. This is the same turn that multiplying by a complex number makes in a plane.") : L("With 𝑘, the axis out of the screen, chosen, the turn becomes the one that multiplying by a complex number makes in a flat plane."),
                    })}
            </Verdict>
            <Readout
              rows={[
                [L("The turn so far, as a quaternion"), show(q)],
                [L("First number of the quaternion"), L("cos {{h}} deg = {{v}}", { h: half.toFixed(0), v: Math.cos((half * Math.PI) / 180).toFixed(3) })],
                [L("Other three numbers of the quaternion"), L("sin {{h}} deg = {{v}}, times the axis {{axis}}", { h: half.toFixed(0), v: Math.sin((half * Math.PI) / 180).toFixed(3), axis: v3(axis) })],
                [L("Right-hand end of the roof: before, and now"), `${v3(before)}, ${v3(after)}`],
                [L("How a point is turned by q"), L("q times the point times the reverse of q, a product called the sandwich")],
                [L("The three units"), L("𝑖 𝑖 = 𝑗 𝑗 = 𝑘 𝑘 = 𝑖 𝑗 𝑘 = minus one")],
                [L("Length of the quaternion"), L("{{n}}: length one means it turns without stretching", { n: Math.hypot(...unit(q)).toFixed(3) })],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("With two turns about different axes, the order matters: turning first about one axis and then about the other gives a different result from the reverse order. Mathematicians say that such turns do not commute. The page 'Quaternions' in the Applications section of this topic shows this with two houses side by side, and tells where these numbers steer spacecraft, robots and phones.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-quaternions-play" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
