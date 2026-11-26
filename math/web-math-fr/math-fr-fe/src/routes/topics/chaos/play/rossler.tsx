import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Aim } from "@/components/Aim";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Orbit3 } from "@/components/Orbit3";
import { PaletteBar } from "@/components/PaletteBar";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/chaos";
import { INK, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { boxDimension, crossing, integrate, kaplanYorke, lyapunov, meanDivergence, orbitDiagram, rossler, section } from "@/systems/flow";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/chaos/play/rossler")({
  loader: () => api.system(TOPIC, "rossler"),
  component: RosslerPage,
});

const START = { a: 0.2, b: 0.2, c: 5.7, zoom: 1, period: 48 };
const AIM = { azimuth: 0.9, elevation: 0.5 };
const DT = 0.01;
const STEPS = 120000;
const PER = 40;
const TICKS = STEPS / PER;
const PRESETS = [
  { id: "2.5", label: L("c = 2.5: one loop"), c: 2.5 },
  { id: "3.5", label: L("c = 3.5: two loops"), c: 3.5 },
  { id: "4.1", label: L("c = 4.1: four loops"), c: 4.1 },
  { id: "5.7", label: L("c = 5.7: chaos"), c: 5.7 },
  { id: "12", label: L("c = 12: a larger c"), c: 12 },
];

/** how many distinct values a list of crossings has, to a picture's tolerance. */
function distinct(values: number[], tol: number) {
  const seen: number[] = [];
  for (const v of values) if (!seen.some((s) => Math.abs(s - v) < tol)) seen.push(v);
  return seen.length;
}

const CR: [number, number] = [2, 18];

function RosslerPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);

  const [look, setLook] = useState(START);
  const [aim, setAim] = useState(AIM);
  const [turning, setTurning] = useState(true);
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(2);

  const [limit, setLimit] = useState(Math.round(TICKS * PER * DT));
  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: Math.min(TICKS, Math.round(limit / (PER * DT))) });
  const upTo = Math.min(shown, TICKS) * PER;
  const t = upTo * DT;

  const f = useMemo(() => rossler(look.a, look.b, look.c), [look.a, look.b, look.c]);
  const path = useMemo(() => integrate(f, [1, 1, 1], DT, STEPS, "rk4", 20000), [f]);
  const cuts = useMemo(() => section(path, 1, 0, [0, 2]), [path]);
  const seen = useMemo(() => cuts.filter((c) => c.t <= t), [cuts, t]);
  const returns = useMemo(() => seen.slice(0, -1).map((c, i) => [c.a, seen[i + 1].a] as [number, number]), [seen]);
  const measured = useMemo(() => {
    const l = lyapunov(f, [1, 1, 1], DT, 1.0, 3000, 3000);
    const md = meanDivergence(f, path);
    return { l, md, ky: kaplanYorke(l.lambda, md), box: boxDimension(path, 8) };
  }, [f, path]);
  const spread = useMemo(() => {
    const xs = cuts.map((c) => c.a);
    return xs.length ? Math.max(...xs) - Math.min(...xs) : 1;
  }, [cuts]);
  const kinds = useMemo(() => distinct(seen.slice(-40).map((c) => c.a), Math.max(0.02, spread * 0.01)), [seen, spread]);

  const set = <K extends keyof typeof START>(name: K) => (v: number) => setLook((was) => ({ ...was, [name]: v }));
  const colours = [palette.roles[0] ?? palette.ink];
  const dots = palette.roles[2] ?? palette.ink;
  const reset = () => {
    runner.reset();
    setShown(0);
  };
  // the diagram over c with a and b held: x at each crossing of the plane, one dot above its c
  const sweep = useMemo(
    () => orbitDiagram((c) => rossler(look.a, look.b, c), CR[0], CR[1], 320, [1, 1, 1], 0.01, 4000, 8000, crossing(1, 0, 0)),
    [look.a, look.b],
  );
  const sweepBox = useMemo<Box>(() => {
    const all = sweep.flatMap((col) => col.values);
    const lo = all.length ? Math.min(...all) : -10;
    const hi = all.length ? Math.max(...all) : 10;
    const pad = (hi - lo) * 0.06 || 1;
    return { x0: CR[0], x1: CR[1], y0: lo - pad, y1: hi + pad };
  }, [sweep]);
  const preset = PRESETS.find((p) => p.c === look.c && look.a === 0.2 && look.b === 0.2)?.id ?? "";

  const sectionBox = useMemo<Box>(() => {
    if (!cuts.length) return { x0: -1, x1: 1, y0: -1, y1: 1 };
    const xs = cuts.map((c) => c.a);
    const ys = cuts.map((c) => c.b);
    const px = (Math.max(...xs) - Math.min(...xs)) * 0.1 || 0.5;
    const py = (Math.max(...ys) - Math.min(...ys)) * 0.1 || 0.5;
    return { x0: Math.min(...xs) - px, x1: Math.max(...xs) + px, y0: Math.min(...ys) - py, y1: Math.max(...ys) + py };
  }, [cuts]);
  const returnBox = useMemo<Box>(() => {
    if (!cuts.length) return { x0: -1, x1: 1, y0: -1, y1: 1 };
    const xs = cuts.map((c) => c.a);
    const p = (Math.max(...xs) - Math.min(...xs)) * 0.1 || 0.5;
    return { x0: Math.min(...xs) - p, x1: Math.max(...xs) + p, y0: Math.min(...xs) - p, y1: Math.max(...xs) + p };
  }, [cuts]);

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("The Rossler system")}
        job={L("Does a point that moves by three simple rules ever come back to where it was? The point has three coordinates: x, y and z. The rules say how fast each coordinate changes at the point's current position. x changes at the rate -y - z. y changes at the rate x + a y. z changes at the rate b + z (x - c). The letters a, b and c are fixed numbers, set by the sliders. Only one rule multiplies two coordinates together: z times x. Otto Rossler wrote these rules in 1976 as the simplest he could find that still give chaos. Chaos here means two things: the path never repeats, and two starts that are very close end up far apart. The large picture draws the path in three dimensions. After a while the path stays on one shape and keeps circling over it. Such a shape is called an attractor. A path in space is hard to read, so a flat plane is placed across it, and only the places where the path passes through the plane are kept. The small pictures show those places. The question: does the path come back to the same few places on the plane, or to a new place every time?")}
        input={
          <div className="space-y-3">
            <Choices options={PRESETS} value={preset} onPick={(id) => { setLook((was) => ({ ...was, a: 0.2, b: 0.2, c: Number(id) })); reset(); }} />
            <Slider label={L("a: how fast the circling in x and y spirals outward")} min={0.05} max={0.55} step={0.005} value={look.a} format={(v) => v.toFixed(3)} onChange={(v) => { set("a")(v); reset(); }} />
            <Slider label={L("b: a steady push that makes z grow")} min={0.05} max={2} step={0.01} value={look.b} format={(v) => v.toFixed(2)} onChange={(v) => { set("b")(v); reset(); }} />
            <Slider label={L("c: how large x must be before z shoots up")} min={2} max={18} step={0.05} value={look.c} format={(v) => v.toFixed(2)} onChange={(v) => { set("c")(v); reset(); }} />
            <Text kind="note" as="p">
              {L("The buttons set c and put a and b back to 0.2. As c grows, the path changes in jumps. At c = 2.5 it is one closed loop. At c = 3.5 the loop splits in two: the path goes round twice before it repeats. At c = 4.1 it goes round four times before it repeats. At c = 5.7 it never repeats. This splitting of a loop into two is called period doubling. The same doubling happens to a single number under the rule x becomes r x (1 - x), called the logistic map, which another page of this topic studies.")}
            </Text>
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(t)}
            what={L("time units")}
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 50, max: 1200, step: 50 }}
            onToggle={() => {
              if (!runner.running && shown >= Math.min(TICKS, Math.round(limit / (PER * DT)))) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        more={
          <Aim
            turning={turning}
            onTurning={setTurning}
            azimuth={aim.azimuth}
            elevation={aim.elevation}
            onAim={(a, e) => setAim({ azimuth: a, elevation: e })}
            period={look.period}
            onPeriod={set("period")}
            onReset={() => {
              setAim(AIM);
              setLook((was) => ({ ...was, zoom: 1 }));
            }}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div data-slot="plot" className="h-[min(380px,calc(100vh-26rem))] overflow-hidden">
              <Orbit3
                className="h-full w-full"
                paths={[path]}
                colours={colours}
                back={palette.back}
                turning={turning}
                azimuth={aim.azimuth}
                elevation={aim.elevation}
                zoom={look.zoom}
                period={look.period}
                reveal={upTo / STEPS}
                heads
                onAim={(a, e) => {
                  setTurning(false);
                  setAim({ azimuth: a, elevation: e });
                }}
                onZoom={(z) => setLook((was) => ({ ...was, zoom: z }))}
              />
            </div>
            <div><div data-slot="plot" className="h-[180px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={sweepBox}
                deps={[sweep, look.c, palette, sweepBox]}
                onPick={(x) => {
                  set("c")(Math.round(Math.max(CR[0], Math.min(CR[1], x)) * 20) / 20);
                  reset();
                }}
                draw={(pen) => {
                  ticks(pen);
                  const { ctx } = pen;
                  ctx.fillStyle = colours[0];
                  ctx.globalAlpha = 0.55;
                  for (const col of sweep) {
                    const px = pen.px(col.p);
                    for (const v of col.values) ctx.fillRect(px, pen.py(v), 1, 1);
                  }
                  ctx.globalAlpha = 1;
                  pen.line([[look.c, sweepBox.y0], [look.c, sweepBox.y1]], INK, 1);
                }}
              />
            </div><Caption>{L("Picture under the large one: c runs along the bottom, from 2 to 18. Above each value of c, the dots are the values of x at which the path crosses the plane y = 0, once the path has settled. One dot means one loop. Two dots mean the path goes round twice before it repeats, then four dots mean four times. A smeared column means the path never repeats. The vertical line marks the current c. A click on the picture sets c. A picture of this kind is called a bifurcation diagram.")}</Caption></div>
            <div className="grid gap-2 lg:grid-cols-2">
              <div><div data-slot="plot" className="h-[200px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={sectionBox}
                  equal
                  deps={[seen, palette, sectionBox]}
                  draw={(pen) => {
                    ticks(pen);
                    for (const c of seen) pen.dot(c.a, c.b, 1.6, dots);
                    if (seen.length) {
                      const last = seen[seen.length - 1];
                      pen.ring(last.a, last.b, 6, INK, 1.5);
                    }

                  }}
                />
              </div><Caption>{L("The plane y = 0 seen face on. Each dot is a place where the path passed through it, going from negative y to positive y. Across: x. Up: z. The ring marks the latest crossing. Crossings so far: {{n}}", { n: seen.length })}</Caption></div>
              <div><div data-slot="plot" className="h-[200px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={returnBox}
                  equal
                  deps={[returns, palette, returnBox]}
                  draw={(pen) => {
                    ticks(pen);
                    pen.line([[returnBox.x0, returnBox.x0], [returnBox.x1, returnBox.x1]], "#2c3540", 1);
                    for (const [a, b] of returns) pen.dot(a, b, 1.6, dots);
                    if (returns.length) {
                      const last = returns[returns.length - 1];
                      pen.ring(last[0], last[1], 6, INK, 1.5);
                    }

                  }}
                />
              </div><Caption>{L("Each crossing against the next one. A dot's position across is x at one crossing. Its height is x at the following crossing. The thin diagonal line marks where the two are equal.")}</Caption></div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {upTo === 0
                ? L("Press run to set the point moving. The path is drawn while it is being computed. Each time the path passes through the plane y = 0, a dot appears in each of the two small pictures.")
                : seen.length < 3
                  ? seen.length === 1
                    ? L("After {{t}} time units, the path has crossed the plane {{n}} time. A few more crossings are needed before a pattern shows.", { t: t.toFixed(0), n: seen.length })
                    : L("After {{t}} time units, the path has crossed the plane {{n}} times. A few more crossings are needed before a pattern shows.", { t: t.toFixed(0), n: seen.length })
                  : kinds <= 8 && measured.l.lambda < 0.005
                    ? kinds === 1
                      ? L("After {{t}} time units and {{n}} crossings, the path keeps passing through the plane at one and the same place. So the path is a closed loop: it comes back to where it was and repeats itself exactly. A path that repeats after one turn is called a cycle of period {{k}}. In the picture of each crossing against the next, it shows as {{k}} dot on the diagonal line.", { t: t.toFixed(0), n: seen.length, k: kinds })
                      : L("After {{t}} time units and {{n}} crossings, the path keeps passing through the plane at the same {{k}} places, in turn. So the path goes round {{k}} times and then repeats itself exactly. Such a path is called a cycle of period {{k}}. In the picture of each crossing against the next, it shows as {{k}} dots.", { t: t.toFixed(0), n: seen.length, k: kinds })
                    : L("After {{t}} time units and {{n}} crossings, no two crossings are at the same place. On the plane, the dots line up along a curve instead of sitting at a few points. In the picture of each crossing against the next, the dots form a hump: low at both ends, high in the middle. So each crossing fixes the next one by a simple rule from one number to another, even though the path in space never repeats. A rule with the same hump shape, x becomes r x (1 - x), is studied on another page of this topic.", { t: t.toFixed(0), n: seen.length })}
            </Verdict>
            <Readout
              rows={[
                [L("Largest Lyapunov exponent: how fast two very close paths move apart, per time unit"), measured.l.lambda.toFixed(4)],
                [L("What that number says"), measured.l.lambda > 0.005 ? L("Above zero: close paths move apart, so the motion is chaotic") : L("Near zero: close paths stay close, so the path is a repeating loop")],
                [L("Different values of x among the last 40 crossings"), String(kinds)],
                [L("Divergence at the point (1, 1, 1): how fast a tiny cloud of starts grows (plus) or shrinks (minus) there"), (look.a + 1 - look.c).toFixed(4)],
                [L("Divergence averaged along the whole path"), measured.md.toFixed(4)],
                [L("Why the two divergences differ"), L("The divergence equals a + x - c, and x changes along the path")],
                [L("Third Lyapunov exponent: how fast nearby paths are pulled in onto the attractor, per time unit"), measured.ky.lambda3.toFixed(4)],
                [L("Dimension of the attractor from the exponents (Kaplan-Yorke): 1 is a line, 2 a surface"), Number.isFinite(measured.ky.dimension) ? measured.ky.dimension.toFixed(3) : "-"],
                [L("Dimension by counting the small boxes the computed path touches"), measured.box.dimension.toFixed(3)],
                [L("Crossings of the plane along the whole computed path"), String(cuts.length)],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("Keeping only the crossings of the plane drops one coordinate and drops the passing of time. A path that repeats becomes a few fixed places on the plane. A chaotic path becomes a dust of points along a curve. Plotting each crossing against the next turns the motion in space into a rule that takes one number to the next. That rule has the same hump shape as the rule x becomes r x (1 - x), the logistic map.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="chaos-rossler" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
