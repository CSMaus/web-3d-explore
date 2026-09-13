import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Aim } from "@/components/Aim";
import { ChaosTabs } from "@/components/ChaosTabs";
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
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { CHAOS, TOPIC } from "@/lib/chaos";
import { FAINT, INK, MUTED, plate, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { boxDimension, integrate, kaplanYorke, localMax, lorenz, lyapunov, meanDivergence, orbitDiagram } from "@/systems/flow";

export const Route = createFileRoute("/topics/chaos/play/lorenz")({
  loader: () => api.system(TOPIC, "lorenz"),
  component: LorenzPage,
});

const START = { sigma: 10, rho: 28, beta: 8 / 3, zoom: 1, period: 48 };
const AIM = { azimuth: 0.6, elevation: 0.42 };
const DT = 0.004;
const STEPS = 90000;
/** states drawn per run step, so a run is a few thousand steps rather than ninety thousand */
const PER = 30;
const TICKS = STEPS / PER;
/** the gap at which the two are on different wings as often as not: parted for good */
const PARTED = 5;
const PRESETS = [
  { id: "rest", label: "At rest", sigma: 10, rho: 5, beta: 8 / 3 },
  { id: "steady", label: "Steady convection", sigma: 10, rho: 20, beta: 8 / 3 },
  { id: "attractor", label: "The attractor", sigma: 10, rho: 28, beta: 8 / 3 },
];

function LorenzPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);

  const [look, setLook] = useState(START);
  const [aim, setAim] = useState(AIM);
  const [turning, setTurning] = useState(true);
  const [twin, setTwin] = useState(true);
  const [gap, setGap] = useState(1e-8);
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(2);

  const [limit, setLimit] = useState(Math.round(TICKS * PER * DT));
  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: Math.min(TICKS, Math.round(limit / (PER * DT))) });
  const upTo = Math.min(shown, TICKS) * PER;
  const t = upTo * DT;

  const f = useMemo(() => lorenz(look.sigma, look.rho, look.beta), [look.sigma, look.rho, look.beta]);
  const paths = useMemo(() => {
    const first = integrate(f, [1, 1, 1], DT, STEPS, "rk4", 4000);
    if (!twin) return [first];
    return [first, integrate(f, [1 + gap, 1, 1], DT, STEPS, "rk4", 4000)];
  }, [f, twin, gap]);

  const apart = useMemo(() => {
    if (paths.length < 2) return [];
    const a = paths[0];
    const b = paths[1];
    const out: [number, number][] = [];
    for (let i = 0; i < a.count; i += 8) {
      const d = Math.hypot(b.xs[i * 3] - a.xs[i * 3], b.xs[i * 3 + 1] - a.xs[i * 3 + 1], b.xs[i * 3 + 2] - a.xs[i * 3 + 2]);
      out.push([i * DT, Math.log10(Math.max(d, 1e-18))]);
    }
    return out;
  }, [paths]);
  const distanceNow = useMemo(() => {
    if (paths.length < 2 || upTo === 0) return gap;
    const i = Math.min(paths[0].count - 1, upTo - 1);
    const a = paths[0].xs;
    const b = paths[1].xs;
    return Math.hypot(b[i * 3] - a[i * 3], b[i * 3 + 1] - a[i * 3 + 1], b[i * 3 + 2] - a[i * 3 + 2]);
  }, [paths, upTo, gap]);
  const partedAt = useMemo(() => apart.find((p) => p[1] >= Math.log10(PARTED))?.[0] ?? null, [apart]);

  const measured = useMemo(() => {
    const l = lyapunov(f, [1, 1, 1], DT, 0.5, 3000, 3000);
    const md = meanDivergence(f, paths[0]);
    return { l, md, ky: kaplanYorke(l.lambda, md), box: boxDimension(paths[0], 8) };
  }, [f, paths]);
  const horizon = measured.l.lambda > 0 ? Math.log(1 / gap) / measured.l.lambda : null;
  const tenfold = measured.l.lambda > 0 ? Math.LN10 / measured.l.lambda : null;

  const set = <K extends keyof typeof START>(name: K) => (v: number) => setLook((was) => ({ ...was, [name]: v }));
  const colours = [palette.roles[0] ?? palette.ink, palette.roles[2] ?? "#c75ab0"];
  const reset = () => {
    runner.reset();
    setShown(0);
  };

  const seriesBox: Box = useMemo(() => {
    const floor = Math.min(-2, Math.floor(Math.log10(gap)) - 1);
    if (!apart.length) return { x0: 0, x1: 1, y0: floor, y1: 2 };
    const top = apart.reduce((m, p) => Math.max(m, p[1]), -Infinity);
    const full = apart[apart.length - 1][0];
    const saturated = apart.find((p) => p[1] >= top - 0.2);
    const x1 = saturated ? Math.min(full, saturated[0] * 1.6 + 2) : full;
    return { x0: 0, x1, y0: floor, y1: top + 0.8 };
  }, [apart, gap]);

  // the diagram over rho with sigma and beta held: each peak of z is one dot above its rho
  const RHO: [number, number] = [0.5, 60];
  const sweep = useMemo(
    () => orbitDiagram((rho) => lorenz(look.sigma, rho, look.beta), RHO[0], RHO[1], 300, [1, 1, 1], 0.01, 3000, 6000, localMax(2)),
    [look.sigma, look.beta],
  );
  const sweepBox = useMemo<Box>(() => {
    const all = sweep.flatMap((c) => c.values);
    const hi = all.length ? Math.max(...all) : 60;
    return { x0: RHO[0], x1: RHO[1], y0: 0, y1: hi * 1.05 };
  }, [sweep]);
  const preset = PRESETS.find((p) => p.sigma === look.sigma && p.rho === look.rho && Math.abs(p.beta - look.beta) < 1e-9)?.id ?? "";
  const settled = look.rho < 1 ? "rest" : look.rho < 24.74 ? "steady" : "attractor";

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={CHAOS} />
      <div className="mt-4">
        <ChaosTabs />
      </div>
      <TaskPage
        title={system?.name ?? "The Lorenz system"}
        job="Lorenz wrote these three equations in 1963 as a stripped-down model of the weather, and they are the reason a forecast has a horizon: the standard example of a system that is fully determined and still unpredictable. Three equations for a layer of heated fluid, and two starting states so close that no measurement could tell them apart. The job is to follow both forward and watch what happens to the gap between them. That, and not the shape, is what the word chaos means."
        input={
          <div className="space-y-3">
            <Choices options={PRESETS} value={preset} onPick={(id) => { const p = PRESETS.find((x) => x.id === id)!; setLook((was) => ({ ...was, sigma: p.sigma, rho: p.rho, beta: p.beta })); reset(); }} />
            <Slider label="Sigma" min={1} max={20} step={0.1} value={look.sigma} format={(v) => v.toFixed(1)} onChange={(v) => { set("sigma")(v); reset(); }} />
            <Slider label="Rho" min={0.5} max={60} step={0.1} value={look.rho} format={(v) => v.toFixed(1)} onChange={(v) => { set("rho")(v); reset(); }} />
            <Slider label="Beta" min={0.5} max={6} step={0.01} value={look.beta} format={(v) => v.toFixed(2)} onChange={(v) => { set("beta")(v); reset(); }} />
            <p className="text-[11px] text-muted">
              Rho is the heating. Below one the fluid is at rest; past one it convects steadily in
              one of two directions; past about 24.7 both of those lose stability and there is
              nowhere left to settle.
            </p>
            <Choices options={[{ id: "two", label: "Two starts" }, { id: "one", label: "One start" }]} value={twin ? "two" : "one"} onPick={(id) => { setTwin(id === "two"); reset(); }} />
            {twin ? (
              <Slider label="How far apart" min={-14} max={-2} step={0.5} value={Math.log10(gap)} format={(v) => `1e${v.toFixed(1)}`} onChange={(v) => { setGap(Math.pow(10, v)); reset(); }} />
            ) : null}
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(t * 10) / 10}
            what="time units"
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 20, max: 360, step: 10 }}
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
            <div className="h-[min(420px,calc(100vh-24rem))] overflow-hidden rounded border border-edge">
              <Orbit3
                className="h-full w-full"
                paths={paths}
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
            <div><div className="h-[170px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={sweepBox}
                deps={[sweep, look.rho, palette, sweepBox]}
                onPick={(x) => {
                  set("rho")(Math.round(Math.max(RHO[0], Math.min(RHO[1], x)) * 10) / 10);
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
                  pen.line([[look.rho, sweepBox.y0], [look.rho, sweepBox.y1]], INK, 1);
                }}
              />
            </div><Caption>The flow's bifurcation diagram: rho along the bottom, the height of each peak of z above. Click to set rho. A steady state is one point, a cycle a few, the attractor a smear with windows in it.</Caption></div>
            <div><div className="h-[150px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={seriesBox}
                deps={[apart, palette, seriesBox, t]}
                draw={(pen) => {
                  const stride = Math.max(1, Math.round((seriesBox.y1 - seriesBox.y0) / 6));
                  for (let g = Math.ceil(seriesBox.y0); g <= seriesBox.y1; g += stride) {
                    pen.line([[seriesBox.x0, g], [seriesBox.x1, g]], FAINT, 1);
                    pen.text(`1e${g}`, seriesBox.x1 * 0.985, g + 0.16, "#3f4650", "right");
                  }
                  if (!apart.length) {
                    plate(pen, "Two starts are needed for this plot", seriesBox.x1 * 0.28, (seriesBox.y0 + seriesBox.y1) / 2, MUTED);
                    return;
                  }
                  pen.line(apart.filter((p) => p[0] <= t), colours[1], 1.6);
                  pen.line(apart.filter((p) => p[0] >= t), "#2a2330", 1);
                  pen.line([[seriesBox.x0, Math.log10(PARTED)], [seriesBox.x1, Math.log10(PARTED)]], "#3a3f47", 1);
                  if (upTo > 0) pen.dot(Math.min(t, seriesBox.x1), Math.log10(Math.max(distanceNow, 1e-18)), 4, colours[1]);
                  const decades = measured.l.lambda / Math.LN10;
                  const from = Math.log10(gap);
                  const until = Math.min(seriesBox.x1, (seriesBox.y1 - from) / Math.max(decades, 1e-9));
                  pen.line([[0, from], [until, from + decades * until]], "#6f7883", 1);
                }}
              />
            </div><Caption>The gap between the two, against time, one power of ten a line. Grey: the measured exponent as a slope</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={upTo === 0 ? undefined : twin && distanceNow >= PARTED ? false : undefined}>
              {upTo === 0
                ? twin
                  ? `Two states ${gap.toExponential(0)} apart, closer than any measurement could tell apart. Press run and both are followed; the dots are where they are now.`
                  : "One state, followed forward. Press run and watch it circle one wing, cross, circle the other, never crossing its own path and never repeating."
                : !twin
                  ? `${t.toFixed(1)} time units in. ${settled === "attractor" ? "The state keeps switching wings with no pattern to the switching, and the curve never closes: it is drawn on the attractor, a set of no volume that the state never leaves and never repeats on." : settled === "steady" ? "The state spirals in to one of the two convecting states and stays: steady convection." : "The state falls to the origin and stays: the fluid is at rest."}`
                  : distanceNow >= PARTED
                    ? `${t.toFixed(1)} time units in, the two are ${distanceNow.toFixed(1)} apart: as far as the attractor is wide, on different wings as often as not. They parted for good at about ${partedAt?.toFixed(1)} time units. Beyond that, knowing the first start to ${gap.toExponential(0)} says nothing about where the second is.`
                    : distanceNow > gap * 30
                      ? `${t.toFixed(1)} time units in, the gap has grown from ${gap.toExponential(0)} to ${distanceNow.toExponential(1)}: ${tenfold ? `tenfold every ${tenfold.toFixed(1)} time units, a straight climb on the logarithmic plot. ` : ""}the dots still look together; they will not for long.`
                      : `${t.toFixed(1)} time units in, the two dots are ${distanceNow.toExponential(1)} apart: still on top of each other, as they would be in any system. The difference is what comes next.`}
            </Verdict>
            <Readout
              rows={[
                ["Largest Lyapunov exponent", measured.l.lambda.toFixed(4)],
                ["So the gap grows tenfold every", tenfold ? `${tenfold.toFixed(2)} time units` : "Never: it shrinks"],
                ["Prediction horizon", horizon ? `${horizon.toFixed(1)} time units from a start known to ${gap.toExponential(0)}` : "No separation to lose"],
                ["Ten times better measurement buys", measured.l.lambda > 0 ? `${(Math.LN10 / measured.l.lambda).toFixed(2)} more time units` : "-"],
                ["Mean divergence", measured.md.toFixed(4)],
                ["Exactly", `-(sigma + 1 + beta) = ${(-(look.sigma + 1 + look.beta)).toFixed(4)}`],
                ["Third exponent", measured.ky.lambda3.toFixed(4)],
                ["Kaplan-Yorke dimension", Number.isFinite(measured.ky.dimension) ? measured.ky.dimension.toFixed(3) : "-"],
                ["Box counting, on this sample", `${measured.box.dimension.toFixed(3)} over box sizes ${measured.box.sizes[measured.box.window[1]].toFixed(2)} to ${measured.box.sizes[measured.box.window[0]].toFixed(1)}`],
                ["Trajectory", `${STEPS.toLocaleString("en")} states at a step of ${DT}, ${upTo.toLocaleString("en")} drawn`],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              The exponent is the slope of the climb, measured by following a neighbour and pulling
              it back each time it drifts. The volume shrinks at a fixed rate, so the set the state
              lives on has no volume at all, and its dimension, counted two ways, comes out a little
              above two.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="chaos-lorenz" />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
