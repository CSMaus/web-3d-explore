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
  { id: "i", label: "About 𝑖, the along axis", axis: [1, 0, 0], said: "𝑖" },
  { id: "j", label: "About 𝑗, the up axis", axis: [0, 1, 0], said: "𝑗" },
  { id: "k", label: "About 𝑘, the out axis", axis: [0, 0, 1], said: "𝑘" },
  { id: "d", label: "About the diagonal, all three at once", axis: [1, 1, 1], said: "the diagonal" },
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
        title={system?.name ?? "Quaternions"}
        job="One imaginary unit, 𝑖, turned the plane. A thing in space can turn about three axes, along, up and out, so space needs three units, 𝑖, 𝑗 and 𝑘, and a turn in space is written with four numbers: one for how far, three for the axis. The job is to pick an axis and an angle, turn the house step by step, and read the four numbers that do it as they grow."
        input={
          <div className="space-y-3">
            <Text kind="note" as="p">The axis</Text>
            <Choices options={AXES} value={axisId} onPick={(id) => { setAxisId(id); reset(); }} />
            <Slider label="Angle" min={0} max={360} step={5} value={angle} format={(v) => `${v} deg`} onChange={(v) => { setAngle(Math.round(v / 5) * 5); reset(); }} />
            <Text kind="note" as="p">
              Sky is 𝑖, the along axis; green is 𝑗, up; rose is 𝑘, out of the page. The chosen axis is
              drawn through the house in the text colour. The right end of the roof leaves a trail as
              the house turns: a circle around the axis, which is what one turn in space is. Drag the
              picture to look from elsewhere; the wheel brings it closer.
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            limit={FRAMES}
            what="steps of the turn"
            pace="slow"
            onToggle={() => {
              if (!runner.running && at >= FRAMES) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(FRAMES, v + many))}
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
              {`The house, turned ${turned.toFixed(0)} deg about ${chosen.said} so far. Sky: 𝑖, along. Green: 𝑗, up. Rose: 𝑘, out of the page. The line through the house is the chosen axis; the pale trail is the path of the right end of the roof, a circle around that axis.`}
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
                  pen.text("Turn, deg", 350, -0.9, MUTED, "right");
                }}
              />
            </div>
            <Caption>
              {`The four numbers as the turn grows, against the whole angle along the bottom. Green: the first number, cos of half the angle, which starts at one and falls. Rose: the size of the other three, sin of half the angle, which starts at nothing and rises. The dots are where the run is now; the grey line is the angle chosen.`}
            </Caption>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at >= FRAMES ? true : undefined}>
              {at === 0
                ? `The house stands still. Press run: it turns ${angle} deg about ${chosen.said}, a step at a time, and the four numbers of the turn are read off as it goes.`
                : at < FRAMES
                  ? `Turned ${turned.toFixed(0)} deg about ${chosen.said} so far. The quaternion that does it is ${show(q)}: the first number is cos of half the angle, ${half.toFixed(0)} deg, and the other three are sin of half the angle along the axis.`
                  : `Turned ${angle} deg about ${chosen.said}. The four numbers that did it: ${show(whole)}. Half the angle, ${(angle / 2).toFixed(0)} deg, went into them; on the page about 𝑖 the whole angle did, because one unit in the plane needs no axis. ${axisId === "k" ? "About 𝑘 the house turns in the page's own plane, and this is the turn 𝑖 made there." : "Pick 𝑘, the out axis, and the turn becomes the one 𝑖 made in the plane."}`}
            </Verdict>
            <Readout
              rows={[
                ["The turn so far, as a quaternion", show(q)],
                ["Its first number", `cos ${half.toFixed(0)} deg = ${Math.cos((half * Math.PI) / 180).toFixed(3)}`],
                ["Its other three", `sin ${half.toFixed(0)} deg = ${Math.sin((half * Math.PI) / 180).toFixed(3)}, along ${v3(axis)}`],
                ["The roof's end, before and now", `${v3(before)}, ${v3(after)}`],
                ["How a point is turned", "q, then the point, then q reversed: the sandwich"],
                ["The three units", "𝑖 𝑖 = 𝑗 𝑗 = 𝑘 𝑘 = 𝑖 𝑗 𝑘 = minus one"],
                ["Length of the quaternion", `${Math.hypot(...unit(q)).toFixed(3)}, so it turns and does not stretch`],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              Two turns about different axes do not commute: first one then the other is not the same as
              the other way round. The application page under this topic shows it with two houses, and
              says where these numbers steer spacecraft, robots and phones.
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
