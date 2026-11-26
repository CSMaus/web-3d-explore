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
import { FAINT, INK, MUTED, plate, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { boxDimension, integrate, kaplanYorke, localMax, lorenz, lyapunov, meanDivergence, orbitDiagram } from "@/systems/flow";
import { L } from "@/lib/lang";

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
  { id: "rest", label: L("Weak heating: the fluid stays still"), sigma: 10, rho: 5, beta: 8 / 3 },
  { id: "steady", label: L("Medium heating: a steady roll"), sigma: 10, rho: 20, beta: 8 / 3 },
  { id: "attractor", label: L("Strong heating: chaos"), sigma: 10, rho: 28, beta: 8 / 3 },
];

const RHO: [number, number] = [0.5, 60];

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
    <div>
      <TaskPage
        title={system?.name ?? L("The Lorenz system")}
        job={L("Can a rule with no chance in it still be impossible to forecast? In 1963 Edward Lorenz wrote three equations as a much simplified model of the weather: a layer of fluid heated from below. Warm fluid rises, cools and sinks, so the layer rolls over. The three unknowns x, y and z describe how fast the fluid rolls and how its temperature is spread. Nothing in the equations is random: the same start always gives the same future. This page follows two starts that differ by 0.00000001 at first, far less than any instrument could measure, and draws both paths in space. The run button sets them going. The thing to watch is the gap between them. It grows about tenfold every 2.5 time units, until the two paths have nothing to do with each other. This fast growth of a tiny difference, and not the two-winged shape in the picture, is what the word chaos means in mathematics.")}
        input={
          <div className="space-y-3">
            <Choices options={PRESETS} value={preset} onPick={(id) => { const p = PRESETS.find((x) => x.id === id)!; setLook((was) => ({ ...was, sigma: p.sigma, rho: p.rho, beta: p.beta })); reset(); }} />
            <Slider label="Sigma" min={1} max={20} step={0.1} value={look.sigma} format={(v) => v.toFixed(1)} onChange={(v) => { set("sigma")(v); reset(); }} />
            <Slider label="Rho" min={0.5} max={60} step={0.1} value={look.rho} format={(v) => v.toFixed(1)} onChange={(v) => { set("rho")(v); reset(); }} />
            <Slider label="Beta" min={0.5} max={6} step={0.01} value={look.beta} format={(v) => v.toFixed(2)} onChange={(v) => { set("beta")(v); reset(); }} />
            <Text kind="note" as="p">
              {L("The three sliders are the three fixed numbers in the equations: sigma, rho and beta. Rho is how strongly the layer is heated. Below 1 the fluid stays still. Above 1 it rolls steadily, one way or the other. Above about 24.7 neither steady roll can last, and the state never settles. Sigma depends on the fluid and beta on the shape of the layer. The usual values are sigma = 10, rho = 28 and beta = 8/3.")}
            </Text>
            <Choices options={[{ id: "two", label: L("Follow two starts") }, { id: "one", label: L("Follow one start") }]} value={twin ? "two" : "one"} onPick={(id) => { setTwin(id === "two"); reset(); }} />
            {twin ? (
              <Slider label={L("Starting gap between the two")} min={-14} max={-2} step={0.5} value={Math.log10(gap)} format={(v) => `1e${v.toFixed(1)}`} onChange={(v) => { setGap(Math.pow(10, v)); reset(); }} />
            ) : null}
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(t * 10) / 10}
            what={L("time units")}
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 20, max: 360, step: 10 }}
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
            <div data-slot="plot" className="h-[min(420px,calc(100vh-24rem))] overflow-hidden">
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
            <div><div data-slot="plot" className="h-[170px] overflow-hidden">
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
            </div><Caption>{L("Middle chart: what the motion does at each amount of heating. Along the bottom: rho, from 0.5 to 60. Up the side: the height of each peak that z reaches as the state goes round. One dot above a value of rho: the fluid settles into one steady roll. A few dots: the motion repeats the same cycle. A smeared column: chaos, with narrow gaps where a cycle returns. The vertical line marks the current rho, and a click on the chart sets a new one. A chart of this kind is called a bifurcation diagram.")}</Caption></div>
            <div><div data-slot="plot" className="h-[150px] overflow-hidden">
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
                    plate(pen, L("This chart needs two starts, not one"), seriesBox.x1 * 0.28, (seriesBox.y0 + seriesBox.y1) / 2, MUTED);
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
            </div><Caption>{L("Bottom chart: the distance between the two states, against time. The grid labels are powers of ten: 1e-8 means 0.00000001, 1e0 means 1, 1e1 means 10. Thick line: the measured distance, faint ahead of the current time. Flat line: a distance of 5, from which the two are parted for good. Thin straight sloping line: growth at the steady measured rate")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={upTo === 0 ? undefined : twin && distanceNow >= PARTED ? false : undefined}>
              {upTo === 0
                ? twin
                  ? L("Two starting states, {{gap}} apart. No instrument could measure a difference this small. The run button sets both going. The two moving dots in the picture show where they are.", { gap: gap.toExponential(0) })
                  : L("One starting state. The run button sets it going. It circles one wing of the shape, crosses to the other wing, circles there, and crosses back. Its path never crosses itself and never repeats.")
                : !twin
                  ? `${L("After {{t}} time units.", { t: t.toFixed(1) })} ${settled === "attractor" ? L("The state keeps switching from one wing to the other, with no pattern in when it switches, and its path never closes. The path lies on a shape called the attractor. The state never leaves this shape and never repeats a loop on it. The shape has no volume at all: it is thinner than any solid.") : settled === "steady" ? L("The state spirals in to one of the two steady rolls and stays there. The fluid turns over at a steady pace.") : L("The state falls to the point (0, 0, 0) and stays there: the fluid does not move.")}`
                  : distanceNow >= PARTED
                    ? L("After {{t}} time units, the two states are {{distance}} apart. That is as wide as the whole shape, and they are often on different wings. They separated for good at about {{parted}} time units. From then on, knowing the first start to within {{gap}} tells nothing about where the second state is.", { t: t.toFixed(1), distance: distanceNow.toFixed(1), parted: partedAt?.toFixed(1) ?? "undefined", gap: gap.toExponential(0) })
                    : distanceNow > gap * 30
                      ? tenfold
                        ? L("After {{t}} time units, the gap has grown from {{gap}} to {{distance}}. It grows tenfold every {{tenfold}} time units, which shows as a straight climb on the bottom chart. The two dots still look like one, but not for long.", { t: t.toFixed(1), gap: gap.toExponential(0), distance: distanceNow.toExponential(1), tenfold: tenfold.toFixed(1) })
                        : L("After {{t}} time units, the gap has grown from {{gap}} to {{distance}}. The two dots still look like one, but not for long.", { t: t.toFixed(1), gap: gap.toExponential(0), distance: distanceNow.toExponential(1) })
                      : L("After {{t}} time units, the two dots are {{distance}} apart and still look like one. In any system, two close starts stay close at first. What makes this one different is what happens next.", { t: t.toFixed(1), distance: distanceNow.toExponential(1) })}
            </Verdict>
            <Readout
              rows={[
                [L("Largest Lyapunov exponent: how fast a tiny gap grows"), measured.l.lambda.toFixed(4)],
                [L("Time for a tiny gap to grow tenfold"), tenfold ? L("{{n}} time units", { n: tenfold.toFixed(2) }) : L("Never: tiny gaps shrink here")],
                [L("Prediction horizon: how long a forecast stays useful"), horizon ? L("{{n}} time units, if the start is known to within {{gap}}", { n: horizon.toFixed(1), gap: gap.toExponential(0) }) : L("No limit: close starts stay close")],
                [L("Extra forecast time from a start measured 10 times more precisely"), measured.l.lambda > 0 ? L("{{n}} time units more", { n: (Math.LN10 / measured.l.lambda).toFixed(2) }) : "-"],
                [L("Mean divergence: how fast a small blob of states loses volume"), measured.md.toFixed(4)],
                [L("The exact value, from the equations"), `-(sigma + 1 + beta) = ${(-(look.sigma + 1 + look.beta)).toFixed(4)}`],
                [L("Third Lyapunov exponent: how fast the most squeezed direction shrinks"), measured.ky.lambda3.toFixed(4)],
                [L("Kaplan-Yorke dimension: computed from the three exponents"), Number.isFinite(measured.ky.dimension) ? measured.ky.dimension.toFixed(3) : "-"],
                [L("Box-counting dimension of the computed path"), L("{{dimension}}, from boxes of size {{from}} to {{to}}", { dimension: measured.box.dimension.toFixed(3), from: measured.box.sizes[measured.box.window[1]].toFixed(2), to: measured.box.sizes[measured.box.window[0]].toFixed(1) })],
                [L("Path computed"), L("{{steps}} states, {{dt}} time units apart; {{drawn}} drawn so far", { steps: STEPS.toLocaleString("en"), dt: DT, drawn: upTo.toLocaleString("en") })],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("How the numbers are measured. The Lyapunov exponent is the slope of the climb on the bottom chart: the rate at which a tiny gap grows. The page measures it by following a second state very close to the first and moving it back close each time it drifts away. The divergence is the rate at which a small blob of states loses volume. For these equations it is the same everywhere, so the shape the state ends on has no volume at all. Dimension says how much room a shape fills: a line has dimension 1, a surface 2, a solid 3. Box counting covers the path with small boxes and sees how fast the count grows as the boxes shrink. Measured in two ways, this shape comes out a little above 2: more than a surface, much less than a solid.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="chaos-lorenz" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
