import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/complex";
import { INK, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { abs, orbit, show, turns, type C } from "@/systems/complex";
import { ComplexFrame } from "./-shared";

export const Route = createFileRoute("/topics/complex/play/square")({
  loader: () => api.system(TOPIC, "square"),
  component: SquarePage,
});

const BOX: Box = { x0: -2.4, x1: 2.4, y0: -2.4, y1: 2.4 };
const MOST = 40;
const SHIFTS = [
  { id: "none", label: "No shift: just square", c: [0, 0] as C },
  { id: "a", label: "Shift by -0.5 + 0.5i", c: [-0.5, 0.5] as C },
  { id: "b", label: "Shift by 0.3 + 0.5i", c: [0.3, 0.5] as C },
  { id: "c", label: "Shift by -0.8 + 0.16i", c: [-0.8, 0.16] as C },
];
const GRID = 44;

function SquarePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [start, setStart] = useState<C>([0.9, 0.35]);
  const [shift, setShift] = useState("none");
  const [depth, setDepth] = useState(30);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(0.15);

  const c = SHIFTS.find((s) => s.id === shift)!.c;
  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: MOST });
  const path = useMemo(() => orbit(start, c, MOST), [start, c]);
  const n = Math.min(tick, path.path.length - 1);
  const z = path.path[n];
  // the picture of who stays: every start on a grid, coloured by how long it takes to leave
  const field = useMemo(() => {
    const out: number[] = [];
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const x = BOX.x0 + ((i + 0.5) / GRID) * (BOX.x1 - BOX.x0);
        const y = BOX.y1 - ((j + 0.5) / GRID) * (BOX.y1 - BOX.y0);
        out.push(orbit([x, y], c, depth).left ?? -1);
      }
    }
    return out;
  }, [c, depth]);
  const reset = () => {
    runner.reset();
    setTick(0);
  };
  const left = path.left;

  return (
    <ComplexFrame>
      <TaskPage
        title={system?.name ?? "Squaring, again and again"}
        job="Squaring a number multiplies it by itself: the angle doubles and the length squares. Do that again and again and one of three things happens: a start inside the unit circle falls to zero, a start outside runs off to infinity, a start on the circle stays on it. Then add a small shift after every squaring, and the line between falling and running stops being a circle. The job is to follow one start and to see the whole map of which starts stay."
        input={
          <div className="space-y-3">
            <Choices options={SHIFTS} value={shift} onPick={(id) => { setShift(id); reset(); }} />
            <Slider label="Map depth" min={5} max={60} step={1} value={depth} format={(v) => `${Math.round(v)} squarings`} onChange={(v) => setDepth(Math.round(v))} />
            <p className="text-[11px] text-muted">
              Click anywhere to choose the start. The background shows every start at once: dark
              where it has not left after the map's depth, brighter the sooner it left. With no shift
              the dark region is the unit disc. With a shift it is a Julia set, and the fractals
              topic draws these in full.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            limit={MOST}
            what="squarings"
            onToggle={() => {
              if (!runner.running && n >= path.path.length - 1) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(MOST, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage}>
            <div className="h-[min(500px,calc(100vh-20rem))] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={BOX}
                equal
                deps={[field, path, n, start]}
                onPick={(x, y) => {
                  setStart([Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
                  reset();
                }}
                draw={(pen) => {
                  const cw = pen.width / GRID;
                  const ch = pen.height / GRID;
                  const v = pen.box;
                  for (let j = 0; j < GRID; j++) {
                    for (let i = 0; i < GRID; i++) {
                      const t = field[j * GRID + i];
                      const x = BOX.x0 + (i / GRID) * (BOX.x1 - BOX.x0);
                      const y = BOX.y1 - (j / GRID) * (BOX.y1 - BOX.y0);
                      const px = pen.px(x);
                      const py = pen.py(y);
                      if (x < v.x0 - 1 || x > v.x1 + 1) continue;
                      const shade = t < 0 ? 0 : Math.min(1, 0.25 + 0.75 * (1 - t / depth));
                      pen.ctx.fillStyle = t < 0 ? "#111a24" : `rgba(143,211,232,${(0.15 + 0.5 * shade).toFixed(3)})`;
                      pen.ctx.fillRect(px, py, cw * (v.x1 - v.x0 > 0 ? (BOX.x1 - BOX.x0) / (v.x1 - v.x0) : 1) + 1, ch * ((BOX.y1 - BOX.y0) / (v.y1 - v.y0)) + 1);
                    }
                  }
                  ticks(pen, { x: 1, y: 1 });
                  pen.axes("#3a4048");
                  const unit: [number, number][] = [];
                  for (let i = 0; i <= 120; i++) unit.push([Math.cos((i / 120) * 2 * Math.PI), Math.sin((i / 120) * 2 * Math.PI)]);
                  pen.line(unit, "#3a4a5c", 1);
                  const escape: [number, number][] = [];
                  for (let i = 0; i <= 120; i++) escape.push([2 * Math.cos((i / 120) * 2 * Math.PI), 2 * Math.sin((i / 120) * 2 * Math.PI)]);
                  pen.line(escape, "#4a3a3a", 1);
                  pen.line(path.path.slice(0, n + 1), ONE, 1.4);
                  for (let k = 0; k < n; k++) pen.dot(path.path[k][0], path.path[k][1], 2.5, "#3a4a3c");
                  pen.ring(start[0], start[1], 6, SKY, 1.5);
                  pen.dot(z[0], z[1], 5, INK);
                  if (shift !== "none") pen.dot(c[0], c[1], 4, TWO);
                }}
              />
            </div>
            <Caption>Sky ring: the start. White: where the number is now. Green: the path so far. Blue circle: length one. Dark red circle: length two, past which a number never comes back. Background: every start, dark if it has not left after {depth} squarings, brighter the sooner it left.{shift !== "none" ? " Rose dot: the shift c." : ""}</Caption>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={n === 0 ? undefined : left !== null && n >= left ? false : true}>
              {n === 0
                ? `Start at ${show(start)}, length ${abs(start).toFixed(3)}${shift === "none" ? (abs(start) < 1 ? ", inside the circle" : abs(start) > 1 ? ", outside the circle" : ", on the circle") : ""}. Press run.`
                : left !== null && n >= left
                  ? `After ${left} squaring${left === 1 ? "" : "s"} the length passed two and the number is gone for good: from there each squaring at least doubles the distance and the shift cannot pull it back. This start leaves.`
                  : shift === "none"
                    ? `After ${n} squarings the number is at ${show(z)}, length ${abs(z).toFixed(4)}, angle ${(turns(z) * 360).toFixed(0)} deg. ${abs(start) < 1 ? "The length squares each time, so it is falling to zero: this start stays." : abs(start) > 1 ? "The length is growing and will pass two." : "On the circle the length is one, squared is one: it stays on the circle, turning by a doubling angle each time."}`
                    : `After ${n} squarings and shifts the number is at ${show(z)}, length ${abs(z).toFixed(3)}. It has not passed two${n === MOST ? ", after the whole run: this start stays, and it is one of the dark points on the map" : ""}.`}
            </Verdict>
            <Readout
              rows={[
                ["Start", show(start)],
                ["Shift added each time", show(c)],
                ["Now", show(z)],
                ["Length now", abs(z).toFixed(4)],
                ["Left, after", left === null ? `not within ${MOST}` : `${left} squarings`],
                ["Squarings so far", `${n} of ${MOST}`],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              The map of which starts stay is a Julia set when there is a shift. The fractals topic
              draws it at full resolution, and the Mandelbrot set is the same question asked of the
              shift instead of the start. Both are this page, done for every point at once.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`complex-square-${shift}`} />
            <Equations system={system} />
          </>
        }
      />
    </ComplexFrame>
  );
}

