import { createFileRoute } from "@tanstack/react-router";
import { Label, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Orbit3 } from "@/components/Orbit3";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/complex";
import { L } from "@/lib/lang";
import { ONE, SKY, TWO } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import type { Path } from "@/systems/flow";
import { HOUSE, ONE_Q, between, fromAxisAngle, mul, rotate, show, slerp, toAxisAngle, type Q, type V3 } from "@/systems/quaternion";

export const Route = createFileRoute("/topics/complex/uses/quaternions")({
  loader: () => api.system(TOPIC, "quaternions"),
  component: QuaternionPage,
});

const FRAMES = 100;
const AXES: { id: string; label: string; axis: V3 }[] = [
  { id: "i", label: L("About i: the horizontal axis"), axis: [1, 0, 0] },
  { id: "j", label: L("About j: the vertical axis"), axis: [0, 1, 0] },
  { id: "k", label: L("About k: the axis out of the screen"), axis: [0, 0, 1] },
];
const REACH = 1.7;

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

/** the orientation part way through "first a, then b": a alone for the first half, then b applied after it. */
function partWay(a: Q, b: Q, f: number): Q {
  if (f <= 0.5) return slerp(ONE_Q, a, f * 2);
  return mul(slerp(ONE_Q, b, (f - 0.5) * 2), a);
}

function QuaternionPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);
  const [firstAxis, setFirstAxis] = useState("i");
  const [firstAngle, setFirstAngle] = useState(90);
  const [secondAxis, setSecondAxis] = useState("j");
  const [secondAngle, setSecondAngle] = useState(90);
  const [aim, setAim] = useState({ azimuth: 0.7, elevation: 0.45 });
  const [zoom, setZoom] = useState(1);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(0.5);

  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: FRAMES });
  const at = Math.min(tick, FRAMES);
  const f = at / FRAMES;
  const qa = useMemo(() => fromAxisAngle(AXES.find((x) => x.id === firstAxis)!.axis, (firstAngle * Math.PI) / 180), [firstAxis, firstAngle]);
  const qb = useMemo(() => fromAxisAngle(AXES.find((x) => x.id === secondAxis)!.axis, (secondAngle * Math.PI) / 180), [secondAxis, secondAngle]);
  const left = useMemo(() => partWay(qa, qb, f), [qa, qb, f]);
  const right = useMemo(() => partWay(qb, qa, f), [qa, qb, f]);
  const houseLeft = useMemo(() => pathOf(HOUSE.map((p) => rotate(left, p))), [left]);
  const houseRight = useMemo(() => pathOf(HOUSE.map((p) => rotate(right, p))), [right]);
  const ab = useMemo(() => mul(qb, qa), [qa, qb]);
  const ba = useMemo(() => mul(qa, qb), [qa, qb]);
  const apart = (between(ab, ba) * 180) / Math.PI;
  const sameAxis = firstAxis === secondAxis;
  const colours = [SKY, ONE, TWO, palette.back, "#e8e8ea"];
  const deg = (r: number) => L("{{n}} deg", { n: ((r * 180) / Math.PI).toFixed(0) });
  const axisName = (v: V3) => {
    const names = ["i", "j", "k"];
    return v.map((c, idx) => (Math.abs(c) < 0.005 ? null : `${c < 0 ? "-" : ""}${Math.abs(Math.abs(c) - 1) < 0.005 ? "" : Math.abs(c).toFixed(2)}${names[idx]}`)).filter(Boolean).join(" + ").replace(/\+ -/g, "- ") || L("none");
  };
  const reset = () => {
    runner.reset();
    setTick(0);
  };
  const view = (house: Path) => (
    <Orbit3
      className="h-full w-full"
      paths={[...AXIS_PATHS.slice(0, 3), AXIS_PATHS[3], house]}
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
  );

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("Quaternions")}
        job={L("Why does the order of two turns matter in space, and how are such turns written as numbers? In a flat plane one extra number is enough: i, whose square is minus one. Multiplying by i turns an arrow a quarter turn, and every turn of the plane is a multiplication by a complex number of length one. In 1843 William Rowan Hamilton found that turns in space need three such units, i, j and k, with i i = j j = k k = i j k = minus one, and cut the formula into a stone of a Dublin bridge. A number made of an ordinary part and these three parts is called a quaternion. A quaternion of length one is a turn in space, exactly as a complex number of length one is a turn in the plane. One thing is new. In the plane two turns done in either order end in the same place; in space they do not. The page gives a house two turns, in both orders at once, and the two houses end up facing different ways. That is why i j is k but j i is minus k.")}
        input={
          <div className="space-y-3">
            <Text kind="note" as="p">{L("The first turn")}</Text>
            <Choices options={AXES} value={firstAxis} onPick={(id) => { setFirstAxis(id); reset(); }} />
            <Slider label={L("Angle of the turn")} min={-180} max={180} step={5} value={firstAngle} format={(v) => L("{{n}} deg", { n: v })} onChange={(v) => { setFirstAngle(Math.round(v / 5) * 5); reset(); }} />
            <Text kind="note" as="p">{L("The second turn")}</Text>
            <Choices options={AXES} value={secondAxis} onPick={(id) => { setSecondAxis(id); reset(); }} />
            <Slider label={L("Angle of the turn")} min={-180} max={180} step={5} value={secondAngle} format={(v) => L("{{n}} deg", { n: v })} onChange={(v) => { setSecondAngle(Math.round(v / 5) * 5); reset(); }} />
            <Text kind="note" as="p">
              {L("The left house does the first turn and then the second. The right house does the same two turns in the opposite order. Dragging either picture changes the viewpoint of both. The quaternion of a turn uses half its angle: the turn by an angle about an axis is the cosine of half the angle, plus the sine of half the angle times the axis. The cosine and the sine of an angle say how far across and how far up a point lies when it is turned by that angle on a circle of radius one.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            limit={FRAMES}
            what={L("per cent of the two turns")}
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
        more={
          <section data-slot="panel">
            <Label>{L("WHERE QUATERNIONS ARE USED")}</Label>
            <ul data-text="note" className="mt-2 space-y-2">
              <li>
                {L("In anything that turns in space and must never lose track of which way is up. The older way describes an orientation with three angles. It has positions where two of the axes line up and one direction of turning is lost. This is called gimbal lock, and it is what the Apollo warning lights were about. Four numbers with one condition, that their length is one, have no such position. A smooth path between two orientations is then a single formula, Shoemake's slerp of 1985, which is what the run on this page does.")}
              </li>
              <li>
                {L("The Space Shuttle's autopilot was built around quaternion algebra, and satellites are steered with quaternions today, as are aircraft simulators and robots: the standard robot operating system stores every orientation as one. A phone's rotation sensor reports one. The method that combines its gyroscope and its compass, Madgwick's filter of 2011, works with them. Every game engine keeps its rotations as quaternions for the same two reasons. Molecules in a simulation are turned with them, and the pulses of a magnetic resonance scanner turn the spins of atomic nuclei by quaternion turns.")}
              </li>
              <li>
                {L("Metamaterials are materials whose behaviour comes from a small repeated structure rather than from the substance they are made of. Examples are a lens as flat as a sheet, a cloak that steers microwaves round an object, a surface that redirects a 6G radio beam, a panel that absorbs sound, and a buried lattice that turns ground shaking aside. Quaternions appear in this work in a few places, and there they are a rare tool, not the usual one. They keep track of the rotations when the repeated cell of a metal lattice is turned to make it stronger (Zhu and colleagues, 2025). They label the way the bands of a photonic crystal, a material that guides light, braid around each other; this braiding is a charge whose order matters, first seen in a metamaterial in 2020 (Yang and colleagues, after Wu, Soluyanov and Bzdusek in 2019). They are also the numbers that a quaternion neural network reads from the polarisation of radio waves reflected by a smart radio surface (Buvarp and colleagues, 2025). The chiral media that those materials imitate, materials that differ from their own mirror image, have a one-line quaternion form of Maxwell's equations, the laws of electricity and magnetism (Kravchenko, 2003).")}
              </li>
              <li>
                {L("Beyond the quaternions. Doubling once more gives the octonions, with eight parts, which also give up associativity: (a b) c is no longer always equal to a (b c). Frobenius proved in 1878 that the real numbers, the complex numbers and the quaternions are the only systems of this kind in which every non-zero number can be divided by. Three, and no more.")}
              </li>
            </ul>
          </section>
        }
        picture={
          <section ref={stage} className="grid gap-2 lg:grid-cols-2">
            <div>
              <div data-slot="plot" className="h-[320px] overflow-hidden">{view(houseLeft)}</div>
              <Caption>{L("First {{a1}} deg about {{x1}}, then {{a2}} deg about {{x2}}. Three short lines from the centre are the axes: i points across, j up, k out of the screen. Dragging turns the view; the mouse wheel brings it closer.", { a1: firstAngle, x1: firstAxis, a2: secondAngle, x2: secondAxis })}</Caption>
            </div>
            <div>
              <div data-slot="plot" className="h-[320px] overflow-hidden">{view(houseRight)}</div>
              <Caption>{L("The same two turns in the opposite order: first {{a2}} deg about {{x2}}, then {{a1}} deg about {{x1}}. The same house, the same axes and the same viewpoint as on the left.", { a1: firstAngle, x1: firstAxis, a2: secondAngle, x2: secondAxis })}</Caption>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at >= FRAMES ? (sameAxis ? undefined : apart > 1) : undefined}>
              {at === 0
                ? L("Two houses, both facing the same way. Press run: the left one turns {{a1}} deg about {{x1}} and then {{a2}} deg about {{x2}}; the right one does the same turns in the opposite order.", { a1: firstAngle, x1: firstAxis, a2: secondAngle, x2: secondAxis })
                : f <= 0.5
                  ? L("The first turn is under way: the left house is turning about {{x1}}, the right one about {{x2}}. {{p}} per cent of the first turn is done.", { x1: firstAxis, x2: secondAxis, p: Math.round(f * 200) })
                  : f < 1
                    ? L("The second turn is under way: {{p}} per cent done. The two houses already face different ways.", { p: Math.round((f - 0.5) * 200) })
                    : sameAxis
                      ? L("Both turns were about the same axis, and the two houses end up facing the same way. Turns about one axis can be done in either order, exactly as turns in a flat plane. Two different axes show the difference.")
                      : L("The two houses end {{d}} deg apart. First {{x1}} then {{x2}} is a single turn of {{a}} about the axis {{ax}}. The other order is a turn of {{b}} about {{bx}}. The same two turns give different results. So the numbers that stand for turns in space cannot be multiplied in either order with the same result: i j is k, and j i is minus k.", {
                          d: apart.toFixed(0),
                          x1: firstAxis,
                          x2: secondAxis,
                          a: deg(toAxisAngle(ab).angle),
                          ax: axisName(toAxisAngle(ab).axis),
                          b: deg(toAxisAngle(ba).angle),
                          bx: axisName(toAxisAngle(ba).axis),
                        })}
            </Verdict>
            <Readout
              rows={[
                [L("The first turn as a quaternion"), show(qa)],
                [L("The second turn as a quaternion"), show(qb)],
                [L("First turn, then second: q2 · q1"), show(ab)],
                [L("Second turn, then first: q1 · q2"), show(ba)],
                [L("Each result as a single turn"), L("{{a}} about {{ax}}; {{b}} about {{bx}}", { a: deg(toAxisAngle(ab).angle), ax: axisName(toAxisAngle(ab).axis), b: deg(toAxisAngle(ba).angle), bx: axisName(toAxisAngle(ba).axis) })],
                [L("Angle between the two houses at the end"), L("{{n}} deg", { n: apart.toFixed(1) })],
                [L("i times j, and j times i"), L("{{a}}, and {{b}}", { a: show(mul([0, 1, 0, 0], [0, 0, 1, 0])), b: show(mul([0, 0, 1, 0], [0, 1, 0, 0])) })],
                [L("Length of every quaternion here"), L("1, so each is a pure turn with no stretch")],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("Compare the two kinds of numbers. A complex number of length one turns the plane: multiplying by it adds its angle to every arrow. A quaternion of length one turns space, with half angles and a sandwich: the point v is multiplied by q on the left and by the inverse of q on the right, q v q inverse. The half angle is the price of a formula with no special position where a direction is lost. The sandwich is the reason the order matters. With only one imaginary unit, as in a flat plane, the sandwich becomes a single multiplication, and the order never matters.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-quaternions" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
