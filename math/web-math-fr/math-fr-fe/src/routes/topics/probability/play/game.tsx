import { createFileRoute } from "@tanstack/react-router";
import { Button, Swatch, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Equations } from "@/components/Equations";
import { OptionGroup } from "@/components/OptionGroup";
import { Plot } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { StoryOf } from "@/components/StoryOf";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, frame, line, pane, split } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import * as scene from "@/scenes/probability/game";
import type { Values } from "@/scenes/probability/game";
import { STEPS } from "@/storylines/probability/game";
import type { Act } from "@/storylines/probability/game";
import { expectedGain, gainSpread, pick, rngFrom } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/game")({
  loader: () => api.system(TOPIC, "game"),
  component: GamePage,
});

const MOST = 10000;
const COST = 2;

function storyAct(act: Act, values: Values, change: (next: Values) => void) {
  switch (act) {
    case "play":
      return (
        <Button variant="outline" size="sm" onClick={() => change({ seed: values.seed + 1 })}>
          {L("Play 20 rounds")}
        </Button>
      );
  }
}

/**
 * the game: pay 2, throw a die, collect the prize on a six. the throws come from one seed; the run
 * plays them in order and draws the average gain per round over the expected value, and the total
 * over its expected drift with a band of two spreads.
 */
function GamePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [prize, setPrize] = useState(10);
  const [guess, setGuess] = useState(0);
  const [limit, setLimit] = useState(1000);
  const [perFrame, setPerFrame] = useState(5);
  const [n, setN] = useState(0);
  const runner = useRunner((k) => setN(Math.min(limit, k)), { perFrame, stopAt: limit });
  const faces = useMemo(() => {
    const rng = rngFrom(6);
    return Array.from({ length: MOST }, () => 1 + pick(rng, 6));
  }, []);
  const run = useMemo(() => {
    let total = 0;
    let sixes = 0;
    const totals: [number, number][] = [[0, 0]];
    const means: [number, number][] = [];
    for (let i = 0; i < n; i += 1) {
      const six = faces[i] === 6;
      if (six) sixes += 1;
      total += (six ? prize : 0) - COST;
      totals.push([i + 1, total]);
      means.push([i + 1, total / (i + 1)]);
    }
    return { total, sixes, totals, means };
  }, [faces, n, prize]);
  const e = expectedGain(prize, COST);
  const sd = gainSpread(prize);
  const reset = () => {
    runner.reset();
    setN(0);
  };
  const reach = limit * Math.max(Math.abs(e), 0.05) + 3 * sd * Math.sqrt(limit);

  return (
    <TaskPage
      title={system?.name ?? L("A game with a die: pay 2, win 10 on a six")}
      job={L("A round costs 2, and a six on a die wins 10. How much has a player won or lost after 1000 rounds?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("A guess first")} note={L("Set the total a player has after 1000 rounds with a prize of 10: above zero is a gain, below zero a loss. The result compares the guess with the run and with the expected total.")}>
            <Slider label={L("Guess: total after 1000 rounds")} min={-1000} max={1000} step={10} value={guess} format={(v) => String(Math.round(v))} onChange={(v) => setGuess(Math.round(v))} />
          </OptionGroup>
          <OptionGroup title={L("The prize for a six")} note={L("A larger prize raises the expected gain. At 12 the game is fair: the expected gain is zero. The throws of the die stay the same, so only the payouts change.")}>
            <Slider label={L("Prize for a six")} min={6} max={14} step={1} value={prize} format={(v) => String(Math.round(v))} onChange={(v) => setPrize(Math.round(v))} />
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={n}
          limit={limit}
          what={L("rounds")}
          onLimit={(v) => setLimit(Math.round(v))}
          limitRange={{ min: 100, max: MOST, step: 100 }}
          onToggle={() => {
            if (!runner.running && n >= limit) reset();
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
            <span><Swatch colour={ONE} />{L("Solid line: the run")}</span>
            <span><Swatch colour={TWO} />{L("Dashed line: what is expected")}</span>
            <span><Swatch colour={SKY} />{L("Thin lines: two spreads either side")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[run, prize, limit]}
              draw={(pen) => {
                const [a, b] = split(pen, [1, 1]);
                const avg = pane(pen, a, { x0: 0, x1: limit, y0: -2, y1: prize - 2 });
                frame(pen, avg, { x: limit / 4 });
                line(pen, avg, [[0, 0], [limit, 0]], MUTED, 1);
                pen.ctx.setLineDash([5, 4]);
                line(pen, avg, [[0, e], [limit, e]], TWO, 1.6);
                pen.ctx.setLineDash([]);
                line(pen, avg, run.means, ONE, 1.8);
                const tot = pane(pen, b, { x0: 0, x1: limit, y0: -reach, y1: reach });
                frame(pen, tot, { x: limit / 4 });
                const band: [number, number][] = [];
                const under: [number, number][] = [];
                for (let i = 0; i <= 60; i += 1) {
                  const t = (i / 60) * limit;
                  band.push([t, e * t + 2 * sd * Math.sqrt(t)]);
                  under.push([t, e * t - 2 * sd * Math.sqrt(t)]);
                }
                line(pen, tot, band, SKY, 1);
                line(pen, tot, under, SKY, 1);
                pen.ctx.setLineDash([5, 4]);
                line(pen, tot, [[0, 0], [limit, e * limit]], TWO, 1.6);
                pen.ctx.setLineDash([]);
                line(pen, tot, run.totals, ONE, 1.8);
              }}
            />
          </div>
          <Caption>
            {L("In both pictures the rounds played run across. First picture (on the left, or on top on a narrow screen): the average gain per round so far, which is the total divided by the rounds. The dashed line is the expected gain of a round. Second picture: the total gain so far. The dashed line is the expected total. The two thin lines lie two spreads above and below it. A spread is the typical distance of a result from what is expected, and most runs stay between the thin lines.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={n >= 1000 ? Math.abs(run.total / n - e) < 0.2 : undefined}>
            {n === 0
              ? L("No round played yet. With a prize of {{p}}, the expected gain is {{e}} a round, so {{t}} over 1000 rounds. The guess is {{g}}.", { p: prize, e: e.toFixed(3), t: (e * 1000).toFixed(0), g: guess })
              : L("After {{n}} rounds the player's total is {{total}}, an average of {{avg}} a round, from {{six}} sixes. The expected gain is {{e}} a round, or {{et}} over these rounds.", { n, total: run.total, avg: (run.total / n).toFixed(3), six: run.sixes, e: e.toFixed(3), et: (e * n).toFixed(0) })}
          </Verdict>
          <Readout
            rows={[
              [L("Rounds played"), String(n)],
              [L("Sixes thrown, and their share of the rounds"), n ? `${run.sixes}, ${(run.sixes / n).toFixed(3)}` : "-"],
              [L("Total gain so far"), String(run.total)],
              [L("Average gain per round so far"), n ? (run.total / n).toFixed(3) : "-"],
              [L("Expected gain per round"), `${prize}/6 - 2 = ${e.toFixed(3)}`],
              [L("Spread of one round: typical distance from the expected gain"), sd.toFixed(2)],
              [L("Spread of the total after these rounds"), (sd * Math.sqrt(n)).toFixed(1)],
              [L("Guess: total after 1000 rounds"), String(guess)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The average per round comes close to -1/3, while the total does not settle. The reason is how the spread grows. The spread of one round is 3.73. The spread of a total of n rounds is 3.73 x sqrt(n), where sqrt(n) is the square root of n. So the spread grows much more slowly than the number of rounds. After 1000 rounds the total is about -333, give or take about 118. A player can be ahead for a while, but over many rounds the steady loss wins. The rule that averages settle on the expected value is called the law of large numbers.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`probability-game-${prize}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
