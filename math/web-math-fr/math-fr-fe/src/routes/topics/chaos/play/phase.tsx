import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ChaosTabs } from "@/components/ChaosTabs";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { PaletteBar } from "@/components/PaletteBar";
import { Plot, type Box } from "@/components/Plot";
import { ticks as axisTicks } from "@/lib/draw";
import { Caption } from "@/components/Caption";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { CHAOS, TOPIC } from "@/lib/chaos";

import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { divergence, equilibria, integrate, oscillator, predatorPrey, vanDerPol, type Field } from "@/systems/flow";

export const Route = createFileRoute("/topics/chaos/play/phase")({
  loader: () => api.system(TOPIC, "phase"),
  component: PhasePage,
});

const KIND = {
  oscillator: {
    label: "A swing",
    make: (p: number): Field => oscillator(p, 1),
    knob: { label: "Damping", min: -0.6, max: 1.6, step: 0.01, at: 0 },
    box: { x0: -2.4, x1: 2.4, y0: -2.4, y1: 2.4 } as Box,
    note: "Position across, speed up. With no friction the loops close and the swing goes on for ever; any friction at all and every start spirals in to rest. Negative friction is a swing being pushed.",
  },
  vanderpol: {
    label: "Van der Pol",
    make: (p: number): Field => vanDerPol(p),
    knob: { label: "Mu", min: 0.1, max: 4, step: 0.01, at: 1 },
    box: { x0: -4, x1: 4, y0: -6, y1: 6 } as Box,
    note: "A swing pushed when small and braked when large. One rest point, unstable, and one closed loop around it that every start finds from inside or out.",
  },
  predator: {
    label: "Predator and prey",
    make: (p: number): Field => predatorPrey(1, 0.5, p, 0.25),
    knob: { label: "Predator death rate", min: 0.2, max: 1.6, step: 0.01, at: 0.75 },
    box: { x0: -0.5, x1: 8, y0: -0.5, y1: 5 } as Box,
    note: "Prey across, predators up. The populations chase each other round a loop and never settle, and which loop depends only on where they started.",
  },
} as const;
type KindId = keyof typeof KIND;
const KINDS = (Object.keys(KIND) as KindId[]).map((id) => ({ id, label: KIND[id].label }));
const DT = 0.004;
const PER = 5;

function PhasePage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);

  const [kind, setKind] = useState<KindId>("oscillator");
  const [knob, setKnob] = useState<number>(KIND.oscillator.knob.at);
  const [span, setSpan] = useState(24);
  const [seeds, setSeeds] = useState<[number, number][]>([[1.6, 0], [0.5, 0.8]]);
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(2);

  const spec = KIND[kind];
  const box = spec.box;
  const f = useMemo(() => spec.make(knob), [spec, knob]);
  const total = Math.round(span / DT);
  const ticks = Math.ceil(total / PER);
  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: ticks });
  const upTo = Math.min(shown * PER, total);
  const t = upTo * DT;

  const rest = useMemo(() => equilibria(f, [box.x0, box.x1, box.y0, box.y1]), [f, box.x0, box.x1, box.y0, box.y1]);
  const trails = useMemo(
    () =>
      seeds.map((s) => {
        const p = integrate(f, [s[0], s[1]], DT, total + 1, "rk4");
        const pts: [number, number][] = [];
        for (let i = 0; i <= total; i++) pts.push([p.xs[i * 2], p.xs[i * 2 + 1]]);
        return pts;
      }),
    [f, seeds, total],
  );
  const div = divergence(f, [0.001, 0.001]);
  const accent = palette.roles[0] ?? palette.ink;
  const KINDCOLOUR: Record<string, string> = {
    "Stable node": palette.roles[1] ?? accent,
    "Unstable node": "#c75ab0",
    saddle: palette.roles[2] ?? accent,
    "Stable spiral": palette.roles[1] ?? accent,
    "Unstable spiral": "#c75ab0",
    centre: palette.roles[3] ?? accent,
    "Not hyperbolic": "#7c828c",
  };
  const reset = () => {
    runner.reset();
    setShown(0);
  };
  // how far each state is from where it started, and from the nearest rest point, now
  const nowPoints = trails.map((pts) => pts[Math.min(upTo, pts.length - 1)]);
  const nearestRest = (p: [number, number]) => rest.reduce((b, r) => (b === null || Math.hypot(r.at[0] - p[0], r.at[1] - p[1]) < Math.hypot(b.at[0] - p[0], b.at[1] - p[1]) ? r : b), null as (typeof rest)[number] | null);
  const stableRest = rest.find((r) => r.kind === "stable spiral" || r.kind === "stable node");
  const closing = stableRest ? nowPoints.every((p) => Math.hypot(p[0] - stableRest.at[0], p[1] - stableRest.at[1]) < 0.15) : false;
  const spreading = nowPoints.some((p, i) => Math.hypot(p[0], p[1]) > 1.5 * Math.hypot(seeds[i][0], seeds[i][1]) && !stableRest);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={CHAOS} />
      <div className="mt-4">
        <ChaosTabs />
      </div>
      <TaskPage
        title={system?.name ?? "Two unknowns, and the phase plane"}
        job="Two quantities that change each other, drawn as one point: the whole state at one instant is one dot, and the clock is not an axis. The strokes are the rule. The job is to release a few states, let them all run, and see where they go: to rest, round a closed loop, or onto one loop from every side."
        input={
          <div className="space-y-3">
            <Choices options={KINDS} value={kind} onPick={(id) => { setKind(id); setKnob(KIND[id].knob.at); setSeeds([[(KIND[id].box.x1 * 2) / 3, 0], [KIND[id].box.x1 / 5, KIND[id].box.y1 / 4]]); reset(); }} />
            <p className="text-[11px] text-muted">{spec.note}</p>
            <Slider label={spec.knob.label} min={spec.knob.min} max={spec.knob.max} step={spec.knob.step} value={knob} format={(v) => v.toFixed(2)} onChange={(v) => { setKnob(v); reset(); }} />
            <Slider label="How long" min={4} max={80} step={1} value={span} format={(v) => `${Math.round(v)} time units`} onChange={(v) => { setSpan(Math.round(v)); reset(); }} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setSeeds([]); reset(); }} className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-leaf">Clear the states</button>
            </div>
            <p className="text-[11px] text-muted">Click anywhere on the picture to release a state there. Up to twelve run at once.</p>
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(t * 10) / 10}
            what="time units"
            limit={span}
            onToggle={() => {
              if (!runner.running && upTo >= total) reset();
              runner.toggle();
            }}
            onStep={(many) => setShown((v) => Math.min(ticks, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        more={
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">REST POINTS</h2>
            {rest.length === 0 ? (
              <p className="mt-2 text-[11px] text-muted">None in view.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {rest.map((r, i) => (
                  <div key={i} className="font-mono text-[11px]">
                    <div style={{ color: KINDCOLOUR[r.kind] }}>{r.kind}</div>
                    <div className="text-muted">At ({r.at[0].toFixed(3)}, {r.at[1].toFixed(3)}); Eigenvalues {r.eigen.map((e) => (e.im ? `${e.re.toFixed(3)} ${e.im > 0 ? "+" : "-"} ${Math.abs(e.im).toFixed(3)}i` : e.re.toFixed(3))).join(", ")}</div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-muted">
              Found by Newton on the rule itself, then classified from the two eigenvalues of the
              Jacobian there. An eigenvalue on the imaginary axis is reported as such rather than
              rounded into a neighbour, because that is the case the linear picture cannot decide.
            </p>
          </section>
        }
        picture={
          <section ref={stage} className="space-y-1"><div className="h-[min(560px,calc(100vh-16rem))] overflow-hidden rounded border border-edge">
            <Plot
              className="h-full w-full"
              box={box}
              equal
              deps={[kind, knob, trails, upTo, rest, palette]}
              onPick={(x, y) => {
                setSeeds((was) => [...was.slice(-11), [x, y]]);
                reset();
              }}
              draw={(pen) => {
                axisTicks(pen);
                pen.axes("#23262c", 8);
                const view = pen.box;
                const cols = 25;
                const rows = 25;
                for (let i = 0; i < cols; i++) {
                  for (let k = 0; k < rows; k++) {
                    const x = view.x0 + ((view.x1 - view.x0) * (i + 0.5)) / cols;
                    const y = view.y0 + ((view.y1 - view.y0) * (k + 0.5)) / rows;
                    const [dx, dy] = f([x, y], 0);
                    const len = Math.hypot(dx, dy) || 1e-9;
                    const reach = ((view.x1 - view.x0) / cols) * 0.8;
                    pen.arrow(x, y, (dx / len) * reach, (dy / len) * reach, "#333c47");
                  }
                }
                trails.forEach((pts, i) => {
                  const colour = palette.roles[i % palette.roles.length];
                  pen.line(pts.slice(0, upTo + 1), colour, 1.4);
                  pen.ring(pts[0][0], pts[0][1], 4, colour, 1.2);
                  const now = pts[Math.min(upTo, pts.length - 1)];
                  pen.dot(now[0], now[1], 4.5, colour);
                });
                for (const r of rest) {
                  const colour = KINDCOLOUR[r.kind];
                  pen.ring(r.at[0], r.at[1], 6, colour, 2);
                  pen.dot(r.at[0], r.at[1], 2, colour);
                }
              }}
            />
          </div><Caption>Rings: where each state was released.  Dots: where it is now.  Ringed marks: the rest points</Caption></section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {seeds.length === 0
                ? "No state released. Click on the picture to put one down, then press run."
                : upTo === 0
                  ? `${seeds.length} state${seeds.length === 1 ? "" : "s"} waiting. The stroke under each says which way it will move first. Press run and all of them move together.`
                  : closing && stableRest
                    ? `${t.toFixed(1)} time units in, every state has spiralled in to the ${stableRest.kind} at (${stableRest.at[0].toFixed(2)}, ${stableRest.at[1].toFixed(2)}) and stopped. Wherever they started, they end in the same place: that point is an attractor.`
                    : kind === "oscillator" && Math.abs(knob) < 1e-9
                      ? `${t.toFixed(1)} time units in, each state is going round its own closed loop and will keep to it for ever. Nothing pulls them in and nothing pushes them out: with no friction the energy is kept, and no loop is preferred to any other.`
                      : kind === "vanderpol"
                        ? `${t.toFixed(1)} time units in. ${t > span * 0.4 ? "The states released inside and outside are now on the same loop: one closed orbit that every start finds. That loop is an attractor, and it is not a point." : "The inner states are being pushed outward and the outer ones pulled inward, towards one loop between them."}`
                        : kind === "predator"
                          ? `${t.toFixed(1)} time units in. The populations chase each other: more prey, then more predators, then fewer prey, then fewer predators, round a loop set by where they started. ${rest.some((r) => r.kind === "centre") ? "The rest point in the middle is a centre: neither pulling nor pushing." : ""}`
                          : spreading
                            ? `${t.toFixed(1)} time units in, the states are spiralling outward and growing: the rest point pushes everything away. A pushed swing with nothing to stop it.`
                            : `${t.toFixed(1)} time units in. ${stableRest ? `The states are spiralling in towards (${stableRest.at[0].toFixed(2)}, ${stableRest.at[1].toFixed(2)}); the friction takes a little energy every loop.` : `The states follow the strokes; ${nearestRest(nowPoints[0])?.kind ?? "No rest point"} is the nearest rest point to the first one.`}`}
            </Verdict>
            <Readout
              rows={[
                ["States released", String(seeds.length)],
                ["Rest points in view, and what they are", rest.map((r) => r.kind).join(", ") || "none"],
                ["Divergence at the origin", div.toFixed(4)],
                ["So a patch of states", div < -1e-9 ? "Shrinks: an attractor is possible" : div > 1e-9 ? "grows" : "Keeps its area: no attractor exists"],
                ["Time run", `${t.toFixed(2)} of ${span}, at a step of ${DT}`],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              The divergence is the calculus page's rate applied to area: negative means a patch of
              starting states shrinks as it flows, which is what lets many starts end on one thing.
              In two dimensions that thing is a point or a loop. Three dimensions allow a third kind,
              which the next two pages are.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`chaos-phase-${kind}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
