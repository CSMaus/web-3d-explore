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
  { id: "2.5", label: L("One cycle"), c: 2.5 },
  { id: "3.5", label: L("Doubled"), c: 3.5 },
  { id: "4.1", label: L("Four"), c: 4.1 },
  { id: "5.7", label: L("The attractor"), c: 5.7 },
  { id: "12", label: L("Wider"), c: 12 },
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
        job={L("Rossler built this system in 1976 to be the plainest flow that is still chaotic, and it is the usual test case for every method that studies an attractor: the exponent, the dimension, the section. A flow in three dimensions with one non-linear term. The job is to reduce it to something a person can read: put a plane through it, record only where the orbit pierces the plane, and plot each crossing against the next. A three-dimensional flow becomes a map on a line, and the map is the one the next two pages are about.")}
        input={
          <div className="space-y-3">
            <Choices options={PRESETS} value={preset} onPick={(id) => { setLook((was) => ({ ...was, a: 0.2, b: 0.2, c: Number(id) })); reset(); }} />
            <Slider label="a" min={0.05} max={0.55} step={0.005} value={look.a} format={(v) => v.toFixed(3)} onChange={(v) => { set("a")(v); reset(); }} />
            <Slider label="b" min={0.05} max={2} step={0.01} value={look.b} format={(v) => v.toFixed(2)} onChange={(v) => { set("b")(v); reset(); }} />
            <Slider label="c" min={2} max={18} step={0.05} value={look.c} format={(v) => v.toFixed(2)} onChange={(v) => { set("c")(v); reset(); }} />
            <Text kind="note" as="p">
              {L("Walk c up through the presets: a single loop, then a doubled one, then four, then the attractor. The same doubling the logistic map does, met here in a flow.")}
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
            onStep={(many) => setShown((v) => Math.min(TICKS, v + many))}
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
            </div><Caption>{L("The flow's bifurcation diagram: c along the bottom, x at each crossing above. Click to set c. A cycle is one point, doubled is two, then four, then the smear.")}</Caption></div>
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
              </div><Caption>{L("The plane y = 0, crossed upward: {{n}} times so far", { n: seen.length })}</Caption></div>
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
              </div><Caption>{L("Each crossing against the next")}</Caption></div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {upTo === 0
                ? L("Press run. The orbit is drawn as it is integrated, and every time it pierces the plane a dot lands on the section and one on the return map.")
                : seen.length < 3
                  ? seen.length === 1
                    ? L("{{t}} time units in, {{n}} crossing so far. The section needs a few more before it says anything.", { t: t.toFixed(0), n: seen.length })
                    : L("{{t}} time units in, {{n}} crossings so far. The section needs a few more before it says anything.", { t: t.toFixed(0), n: seen.length })
                  : kinds <= 8 && measured.l.lambda < 0.005
                    ? kinds === 1
                      ? L("{{t}} time units in, {{n}} crossings, and they land on {{k}} point over and over: a closed orbit of period {{k}}. The return map is {{k}} dot on the diagonal, and the orbit repeats exactly.", { t: t.toFixed(0), n: seen.length, k: kinds })
                      : L("{{t}} time units in, {{n}} crossings, and they land on {{k}} points over and over: a closed orbit of period {{k}}. The return map is {{k}} dots, and the orbit repeats exactly.", { t: t.toFixed(0), n: seen.length, k: kinds })
                    : L("{{t}} time units in, {{n}} crossings and no two alike: the section is filling a curve, not a set of points, and the return map is a hump. The hump is a one-dimensional map, and the next page iterates one just like it.", { t: t.toFixed(0), n: seen.length })}
            </Verdict>
            <Readout
              rows={[
                [L("Largest Lyapunov exponent"), measured.l.lambda.toFixed(4)],
                [L("Which means"), measured.l.lambda > 0.005 ? L("Neighbours separate: chaos") : L("Neighbours do not separate: a cycle")],
                [L("Distinct crossing values, last forty"), String(kinds)],
                [L("Divergence at (1,1,1)"), (look.a + 1 - look.c).toFixed(4)],
                [L("Mean divergence along the orbit"), measured.md.toFixed(4)],
                [L("And they differ because"), L("A + x - c depends on the state")],
                [L("Third exponent"), measured.ky.lambda3.toFixed(4)],
                [L("Kaplan-Yorke dimension"), Number.isFinite(measured.ky.dimension) ? measured.ky.dimension.toFixed(3) : "-"],
                [L("Box counting, on this sample"), measured.box.dimension.toFixed(3)],
                [L("Crossings in the whole run"), String(cuts.length)],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("The section removes one dimension and the clock at once: a periodic orbit is a finite set of points on it, and the attractor is a dust along a curve. Plotting each crossing against the next turns the flow into a map, and that map has the shape of the logistic one.")}
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
