import { createFileRoute } from "@tanstack/react-router";
import { Button, Swatch, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { OptionGroup } from "@/components/OptionGroup";
import { Plot } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { StoryOf } from "@/components/StoryOf";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { GROUND, INK, MUTED, ONE, SKY, TWO, blend } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, block, frame, line, pane, split } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import * as scene from "@/scenes/probability/walks";
import type { Values } from "@/scenes/probability/walks";
import { STEPS } from "@/storylines/probability/walks";
import type { Act } from "@/storylines/probability/walks";
import { arcsine, arcsineDensity, rngFrom } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/walks")({
  loader: () => api.system(TOPIC, "walks"),
  component: WalksPage,
});

const MOST = 2000;
const WALKS = 1000;
const DRAWN = 50;
const BINS = 20;

function storyAct(act: Act, values: Values, change: (next: Values) => void) {
  switch (act) {
    case "again":
      return (
        <Button variant="outline" size="sm" onClick={() => change({ seed: values.seed + 1 })}>
          {L("Fifty new walks")}
        </Button>
      );
  }
}
const GUESSES = [
  { id: "half", label: L("Near half the time") },
  { id: "ends", label: L("Mostly on one side") },
];

/**
 * a thousand walks of plus or minus one a step, all from one seed, kept step by step so the run can
 * show any moment. fifty are drawn with the square-root envelope; all thousand feed the histogram of
 * the share of their time spent above zero, against the arcsine curve.
 */
function WalksPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [guess, setGuess] = useState("half");
  const [perFrame, setPerFrame] = useState(4);
  const [n, setN] = useState(0);
  const runner = useRunner((k) => setN(Math.min(MOST, k)), { perFrame, stopAt: MOST });
  const walks = useMemo(() => {
    const rng = rngFrom(9);
    const at = new Int16Array(WALKS * (MOST + 1));
    const up = new Int16Array(WALKS * (MOST + 1));
    for (let w = 0; w < WALKS; w += 1) {
      const o = w * (MOST + 1);
      for (let s = 1; s <= MOST; s += 1) {
        at[o + s] = at[o + s - 1] + (rng() < 0.5 ? 1 : -1);
        up[o + s] = up[o + s - 1] + (at[o + s - 1] + at[o + s] > 0 ? 1 : 0);
      }
    }
    return { at, up };
  }, []);
  const now = useMemo(() => {
    let sq = 0;
    const share: number[] = [];
    for (let w = 0; w < WALKS; w += 1) {
      const o = w * (MOST + 1);
      sq += walks.at[o + n] ** 2;
      share.push(n ? walks.up[o + n] / n : 0.5);
    }
    const hist = new Array(BINS).fill(0);
    for (const s of share) hist[Math.min(BINS - 1, Math.floor(s * BINS))] += 1;
    const ends = share.filter((s) => s < 0.1 || s > 0.9).length / WALKS;
    const middle = share.filter((s) => s >= 0.4 && s <= 0.6).length / WALKS;
    return { spread: Math.sqrt(sq / WALKS), hist, ends, middle };
  }, [walks, n]);
  const reset = () => {
    runner.reset();
    setN(0);
  };
  const reach = 3 * Math.sqrt(MOST);
  const right = n >= 200 ? (guess === "ends") === now.ends > now.middle : undefined;

  return (
    <TaskPage
      title={system?.name ?? L("Fifty walks of coin tosses")}
      job={L("Where does a player end up after hundreds of fair coin tosses?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("A guess first")} note={L("'Near half the time' means a fair walk spends about as long above zero as below. 'Mostly on one side' means it tends to stay on the side it reached first. The result says which guess the walks support.")}>
            <Choices options={GUESSES} value={guess} onPick={setGuess} />
          </OptionGroup>
          <Text kind="note" as="p">{L("One step moves all 1000 walks on by one toss. The run stops at 2000 tosses.")}</Text>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={n}
          limit={MOST}
          what={L("tosses")}
          onToggle={() => {
            if (!runner.running && n >= MOST) reset();
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
          <Text kind="note" as="div" className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
            <span><Swatch colour={SKY} />{L("Fifty of the walks")}</span>
            <span><Swatch colour={TWO} />{L("Dashed curves: plus and minus the square root of the tosses, and twice that")}</span>
            <span><Swatch colour={INK} />{L("Thick line: the arcsine curve")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[n, now]}
              draw={(pen) => {
                const [a, b] = split(pen, [3, 2]);
                const paths = pane(pen, a, { x0: 0, x1: MOST, y0: -reach, y1: reach });
                frame(pen, paths, { x: 500, y: 40 });
                const stride = Math.max(1, Math.floor(n / 400));
                for (let w = 0; w < DRAWN; w += 1) {
                  const o = w * (MOST + 1);
                  const pts: [number, number][] = [];
                  for (let s = 0; s <= n; s += stride) pts.push([s, walks.at[o + s]]);
                  if (n % stride) pts.push([n, walks.at[o + n]]);
                  pen.ctx.globalAlpha = 0.55;
                  line(pen, paths, pts, SKY, 1);
                  pen.ctx.globalAlpha = 1;
                }
                pen.ctx.setLineDash([5, 4]);
                for (const k of [1, -1, 2, -2]) {
                  const env: [number, number][] = [];
                  for (let i = 0; i <= 80; i += 1) {
                    const s = (i / 80) * MOST;
                    env.push([s, k * Math.sqrt(s)]);
                  }
                  line(pen, paths, env, TWO, Math.abs(k) === 1 ? 1.6 : 1);
                }
                pen.ctx.setLineDash([]);
                line(pen, paths, [[n, -reach], [n, reach]], MUTED, 1);
                const top = 3.2;
                const hist = pane(pen, b, { x0: 0, x1: 1, y0: 0, y1: top });
                frame(pen, hist, { x: 0.25, y: 1 });
                now.hist.forEach((c, i) => block(pen, hist, i / BINS + 0.004, 0, (i + 1) / BINS - 0.004, Math.min(top, n ? (c / WALKS) * BINS : 0), blend(GROUND, ONE, 0.7)));
                const curve: [number, number][] = [];
                for (let i = 1; i < 200; i += 1) curve.push([i / 200, Math.min(top, arcsineDensity(i / 200))]);
                line(pen, hist, curve, INK, 2);
              }}
            />
          </div>
          <Caption>
            {L("First picture (on the left, or on top on a narrow screen): fifty walks. Across is the number of tosses, up is the position of the walk. The thick dashed curves are at plus and minus the square root of the tosses, the thin ones at twice that. The thin upright line marks the toss reached. Second picture: the 1000 walks sorted by the share of their tosses spent above zero, from 0 on the left to 1 on the right. The bars are scaled so that their total area is 1. The thick line is the arcsine curve, which the bars approach in long walks.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={right}>
            {n === 0
              ? L("No toss yet: every walk is at zero. Press run. One step moves all 1000 walks on by one toss.")
              : L("After {{n}} tosses, a typical walk is {{sd}} steps from zero, against the square root of {{n}}, which is {{r}}. A share of {{e}} of the walks spent less than a tenth or more than nine tenths of the time above zero. Only {{m}} spent between 0.4 and 0.6 of the time above zero.", { n, sd: now.spread.toFixed(1), r: Math.sqrt(n).toFixed(1), e: now.ends.toFixed(3), m: now.middle.toFixed(3) })}
          </Verdict>
          <Readout
            rows={[
              [L("Tosses so far"), String(n)],
              [L("Typical distance of the 1000 walks from zero"), now.spread.toFixed(2)],
              [L("Square root of the tosses"), Math.sqrt(n).toFixed(2)],
              [L("Share of walks above zero under 0.1 or over 0.9 of the time"), now.ends.toFixed(3)],
              [L("Share of walks above zero under 0.1 or over 0.9 of the time, by the arcsine law"), (2 * arcsine(0.1)).toFixed(3)],
              [L("Share of walks above zero 0.4 to 0.6 of the time"), now.middle.toFixed(3)],
              [L("Share of walks above zero 0.4 to 0.6 of the time, by the arcsine law"), (arcsine(0.6) - arcsine(0.4)).toFixed(3)],
              [L("Guess about the share of time above zero"), GUESSES.find((g) => g.id === guess)!.label],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("A fair walk has no memory: a run of losses does not make a win due. But once a walk is on one side, it often takes a long time to come back to zero. So the share of time above zero is more often near 0 or 1 than near one half. The arcsine law gives these shares for long walks, and its curve is shaped like a U. By that law, 0.41 of long walks spend less than a tenth or more than nine tenths of their time above zero, and only 0.128 spend between 0.4 and 0.6. The typical distance from zero is measured as the square root of the average squared position. The computer makes the tosses with a fixed rule that imitates chance, so a run gives the same walks every time.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name="probability-walks" />
          <Equations system={system} />
        </>
      }
    />
  );
}
