import { createFileRoute } from "@tanstack/react-router";
import { Label, Button, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { PaletteBar } from "@/components/PaletteBar";
import { Plot, type Box } from "@/components/Plot";
import { MUTED, TWO, ticks as axisTicks } from "@/lib/draw";
import { Caption } from "@/components/Caption";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/chaos";

import { useRunner } from "@/lib/runner";
import { useLook } from "@/lib/store";
import { divergence, equilibria, integrate, oscillator, predatorPrey, vanDerPol, type Field } from "@/systems/flow";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/chaos/play/phase")({
  loader: () => api.system(TOPIC, "phase"),
  component: PhasePage,
});

const KIND = {
  oscillator: {
    label: L("A swing"),
    make: (p: number): Field => oscillator(p, 1),
    knob: { label: L("Friction"), min: -0.6, max: 1.6, step: 0.01, at: 0 },
    box: { x0: -2.4, x1: 2.4, y0: -2.4, y1: 2.4 } as Box,
    note: L("Along the bottom: where the swing is. Up the side: how fast it moves. The slider sets the friction. With no friction, each state goes round a closed loop, and the swing never stops. With any friction above zero, every state spirals in to the middle: the swing comes to rest. A negative value means the swing gets a small push on every pass, so it swings higher and higher."),
  },
  vanderpol: {
    label: L("A self-driven swing"),
    make: (p: number): Field => vanDerPol(p),
    knob: { label: "Mu", min: 0.1, max: 4, step: 0.01, at: 1 },
    box: { x0: -4, x1: 4, y0: -6, y1: 6 } as Box,
    note: L("A swing that gets pushed while its swings are small and braked while they are large. The equation is named after van der Pol. The slider mu sets how strong the push and the braking are. There is one rest point, in the middle, and it pushes states away. Around it lies one closed loop. Every state ends on that loop, whether it starts inside it or outside."),
  },
  predator: {
    label: L("Predators and prey"),
    make: (p: number): Field => predatorPrey(1, 0.5, p, 0.25),
    knob: { label: L("How fast predators die"), min: 0.2, max: 1.6, step: 0.01, at: 0.75 },
    box: { x0: -0.5, x1: 8, y0: -0.5, y1: 5 } as Box,
    note: L("Along the bottom: how many prey animals there are, for example rabbits. Up the side: how many predators, for example foxes. Both are counted in the model's own units. Plenty of prey feeds more predators. Many predators eat the prey down. Then the predators go hungry and die off, and the prey recover. The two numbers go round a loop and never settle. Which loop they follow depends only on the starting numbers. The slider sets how fast predators die without food."),
  },
} as const;
type KindId = keyof typeof KIND;
const KINDS = (Object.keys(KIND) as KindId[]).map((id) => ({ id, label: KIND[id].label }));
const DT = 0.004;
/** the names of the kinds of rest point, as the page shows them */
const KIND_NAME: Record<string, string> = {
  "stable node": L("stable node"),
  "unstable node": L("unstable node"),
  saddle: L("saddle"),
  "stable spiral": L("stable spiral"),
  "unstable spiral": L("unstable spiral"),
  centre: L("centre"),
  "borderline case": L("borderline case"),
};
const kindName = (kind: string) => KIND_NAME[kind] ?? kind;
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
  // keyed by the names the rest point finder gives (systems/flow.ts)
  const KINDCOLOUR: Record<string, string> = {
    "stable node": palette.roles[1] ?? accent,
    "unstable node": TWO,
    saddle: palette.roles[2] ?? accent,
    "stable spiral": palette.roles[1] ?? accent,
    "unstable spiral": TWO,
    centre: palette.roles[3] ?? accent,
    "not hyperbolic": MUTED,
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
    <div>
      <TaskPage
        title={system?.name ?? L("Two quantities at once: the phase plane")}
        job={L("Where does a swing end up if nobody touches it? To answer, two numbers are needed at once: where the swing is, and how fast it is moving. Together these two numbers are called the state. This page draws the state as one point. For the swing, the position is along the bottom and the speed up the side. As time passes, the point moves and leaves a curve. Time itself has no axis in this picture. The short strokes show which way a state at each place moves next. A picture of this kind is called the phase plane. A click places a starting state, and the run button sets all of them moving. The question is where they go: to rest at one point, round a closed loop for ever, or onto one loop from every side.")}
        input={
          <div className="space-y-3">
            <Choices options={KINDS} value={kind} onPick={(id) => { setKind(id); setKnob(KIND[id].knob.at); setSeeds([[(KIND[id].box.x1 * 2) / 3, 0], [KIND[id].box.x1 / 5, KIND[id].box.y1 / 4]]); reset(); }} />
            <Text kind="note" as="p">{spec.note}</Text>
            <Slider label={spec.knob.label} min={spec.knob.min} max={spec.knob.max} step={spec.knob.step} value={knob} format={(v) => v.toFixed(2)} onChange={(v) => { setKnob(v); reset(); }} />
            <Slider label={L("How long to run")} min={4} max={80} step={1} value={span} format={(v) => L("{{n}} time units", { n: Math.round(v) })} onChange={(v) => { setSpan(Math.round(v)); reset(); }} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => { setSeeds([]); reset(); }}>{L("Remove all states")}</Button>
            </div>
            <Text kind="note" as="p">{L("A click anywhere on the picture places a starting state there. Up to twelve states can run at once. A thirteenth replaces the oldest one.")}</Text>
            <PaletteBar />
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(t * 10) / 10}
            what={L("time units")}
            limit={span}
            onToggle={() => {
              if (!runner.running && upTo >= total) reset();
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
            <Label>{L("REST POINTS")}</Label>
            {rest.length === 0 ? (
              <Text kind="note" as="p" className="mt-2">{L("No rest point inside the picture.")}</Text>
            ) : (
              <div className="mt-2 space-y-2">
                {rest.map((r, i) => (
                  <div key={i} data-text="caption">
                    <div style={{ color: KINDCOLOUR[r.kind] }}>{kindName(r.kind)}</div>
                    <div className="text-muted-foreground">{L("At ({{x}}, {{y}}). Its two rates (eigenvalues): {{eigen}}", { x: r.at[0].toFixed(3), y: r.at[1].toFixed(3), eigen: r.eigen.map((e) => (e.im ? `${e.re.toFixed(3)} ${e.im > 0 ? "+" : "-"} ${Math.abs(e.im).toFixed(3)}i` : e.re.toFixed(3))).join(", ") })}</div>
                  </div>
                ))}
              </div>
            )}
            <Text kind="note" as="p" className="mt-3">
              {L("A rest point is a state where nothing changes: a state placed exactly there stays for ever. The page finds them by Newton's method: guess a point, correct the guess, repeat. Close to a rest point, the motion splits into two simple motions, each growing or shrinking at its own steady rate. These two rates are called eigenvalues, and they decide the name. Both negative: a stable node, states come straight in. Both positive: an unstable node, states go straight out. One of each sign: a saddle, states come in along one line and leave along another. A pair written like -0.5 + 1.2i, -0.5 - 1.2i means the states turn round the point: the first number is the growth rate, the number before i is how fast they turn. Negative growth gives a stable spiral, states spiral in. Positive growth gives an unstable spiral, states spiral out. Zero growth gives a centre, states circle round it. When one of two plain rates is zero, this test cannot decide, and the page says borderline case instead of guessing.")}
            </Text>
          </section>
        }
        picture={
          <section ref={stage} className="space-y-1"><div data-slot="plot" className="h-[min(560px,calc(100vh-16rem))] overflow-hidden">
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
          </div><Caption>{L("Short strokes: the direction a state moves at each place.  Small rings: where each state started.  Filled dots: where each state is now.  Larger rings with a dot inside: the rest points")}</Caption></section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {seeds.length === 0
                ? L("No starting state yet. A click on the picture places one there. Then the run button sets it moving.")
                : upTo === 0
                  ? seeds.length === 1
                    ? L("{{n}} state is waiting to start. The stroke under it shows which way it will move first. The run button sets it moving.", { n: seeds.length })
                    : L("{{n}} states are waiting to start. The stroke under each one shows which way it will move first. The run button sets all of them moving at once.", { n: seeds.length })
                  : closing && stableRest
                    ? L("After {{t}} time units, every state has come to the point ({{x}}, {{y}}) and stopped there. The states started in different places and ended in the same one. A place that draws in states from all around like this is called an attractor. This rest point is a {{kind}}.", { t: t.toFixed(1), kind: kindName(stableRest.kind), x: stableRest.at[0].toFixed(2), y: stableRest.at[1].toFixed(2) })
                    : kind === "oscillator" && Math.abs(knob) < 1e-9
                      ? L("After {{t}} time units, each state is still going round its own closed loop, and it will keep doing so for ever. Nothing pulls the states in and nothing pushes them out. With no friction the swing keeps all its energy, so each loop keeps the size it started with.", { t: t.toFixed(1) })
                      : kind === "vanderpol"
                        ? `${L("After {{t}} time units.", { t: t.toFixed(1) })} ${t > span * 0.4 ? L("The states placed inside the loop and outside it are now on the same loop. Every start ends on this one closed path. A place that draws in states like this is called an attractor, and this one is a loop, not a point.") : L("The states inside are being pushed outward and the states outside are being pulled inward. Both are heading for one loop that lies between them.")}`
                        : kind === "predator"
                          ? `${L("After {{t}} time units.", { t: t.toFixed(1) })} ${L("The two populations chase each other round a loop: more prey, then more predators, then fewer prey, then fewer predators, and so on again. The size of the loop is set by the starting numbers.")} ${rest.some((r) => r.kind === "centre") ? L("The rest point in the middle is a centre: states circle round it, and it neither pulls them in nor pushes them away.") : ""}`
                          : spreading
                            ? L("After {{t}} time units, the states are spiralling outward, and their loops keep growing. The rest point pushes everything away. This is a swing that gets a push on every pass and has nothing to stop it.", { t: t.toFixed(1) })
                            : `${L("After {{t}} time units.", { t: t.toFixed(1) })} ${stableRest ? L("The states are spiralling in towards ({{x}}, {{y}}). Friction takes away a little energy on every loop.", { x: stableRest.at[0].toFixed(2), y: stableRest.at[1].toFixed(2) }) : L("The states follow the strokes. The rest point nearest to the first state is of this kind: {{kind}}.", { kind: nearestRest(nowPoints[0]) ? kindName(nearestRest(nowPoints[0])!.kind) : L("none found") })}`}
            </Verdict>
            <Readout
              rows={[
                [L("Starting states placed"), String(seeds.length)],
                [L("Rest points inside the picture, by kind"), rest.map((r) => kindName(r.kind)).join(", ") || L("none")],
                [L("Divergence at (0, 0): how fast a small patch of states grows or shrinks"), div.toFixed(4)],
                [L("What a small patch of starting states does"), div < -1e-9 ? L("It shrinks, so many starts can end in one place") : div > 1e-9 ? L("It grows") : L("It keeps its area, so nothing can draw states in")],
                [L("Time so far"), L("{{t}} of {{span}} time units, computed in steps of {{dt}}", { t: t.toFixed(2), span, dt: DT })],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("The divergence is the rate at which a small patch of starting states grows or shrinks in area while all its states move. A negative divergence means the patch shrinks. That is what lets many different starts end on one thing, an attractor. On a flat picture, with only two numbers in the state, that thing can only be a point or a closed loop. With three numbers there is room for a third kind, which never settles and never repeats. Two other pages of this topic show it, each with three equations drawn in space.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`chaos-phase-${kind}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
