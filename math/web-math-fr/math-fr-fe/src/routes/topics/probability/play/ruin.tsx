import { createFileRoute } from "@tanstack/react-router";
import { Swatch, Text } from "@kit/index";
import { useRef, useState } from "react";
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
import { INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, frame, line, pane, split } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import * as scene from "@/scenes/probability/ruin";
import type { Values } from "@/scenes/probability/ruin";
import { STEPS } from "@/storylines/probability/ruin";
import type { Act } from "@/storylines/probability/ruin";
import { expectedBets, playRuin, reachChance, rngFrom } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/ruin")({
  loader: () => api.system(TOPIC, "ruin"),
  component: RuinPage,
});

const KEEP = 12;
const SEED = 20;
const COIN_LEAST = 0.4;
const COIN_MOST = 0.6;
const COIN_STEP = 0.01;
const START_LEAST = 1;
const START_MOST = 19;

function storyAct(act: Act, values: Values, change: (next: Values) => void) {
  switch (act) {
    case "coin":
      return (
        <div className="max-w-2xl space-y-3">
          <Slider label={L("Chance to win one toss")} min={COIN_LEAST} max={COIN_MOST} step={COIN_STEP} value={values.p} format={(v) => v.toFixed(2)} onChange={(v) => change({ ...values, p: v })} />
          <Slider label={L("Coins at the start")} min={START_LEAST} max={START_MOST} step={1} value={values.start} format={(v) => String(Math.round(v))} onChange={(v) => change({ ...values, start: Math.round(v) })} />
        </div>
      );
  }
}
type Tally = { games: number; won: number; bets: number; paths: number[][]; share: [number, number][] };
const EMPTY: Tally = { games: 0, won: 0, bets: 0, paths: [], share: [] };

/**
 * the gambler's ruin played game after game from one seed: from the start, bet 1 at a time until the
 * target or zero. the last few games are drawn bet by bet, and the share of games that reached the
 * target is drawn as the games go, beside the formula's chance.
 */
function RuinPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [start, setStart] = useState(10);
  const [target, setTarget] = useState(20);
  const [p, setP] = useState(0.5);
  const [limit, setLimit] = useState(1000);
  const [perFrame, setPerFrame] = useState(2);
  const [tally, setTally] = useState<Tally>(EMPTY);
  const work = useRef({ rng: rngFrom(SEED), tally: { ...EMPTY, share: [] as [number, number][] } });
  const runner = useRunner(
    () => {
      const w = work.current;
      const g = playRuin(start, target, p, w.rng, true);
      const t = w.tally;
      const games = t.games + 1;
      const won = t.won + (g.won ? 1 : 0);
      w.tally = { games, won, bets: t.bets + g.bets, paths: [...t.paths.slice(-(KEEP - 1)), g.path], share: t.share };
      w.tally.share.push([games, won / games]);
      setTally(w.tally);
    },
    { perFrame, stopAt: limit },
  );
  const chance = reachChance(start, target, p);
  const bets = expectedBets(start, target, p);
  const reset = () => {
    runner.reset();
    work.current = { rng: rngFrom(SEED), tally: { ...EMPTY, share: [] } };
    setTally(EMPTY);
  };
  const longest = Math.max(4 * bets, ...tally.paths.map((q) => q.length));
  const share = tally.games ? tally.won / tally.games : 0;

  return (
    <TaskPage
      title={system?.name ?? L("Gambler's ruin")}
      job={L("A gambler starts with 10 and bets 1 at a time on a coin. How often is 20 reached before 0?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("The game")} note={L("Three sliders set the game: the money the gambler starts with, the amount at which the gambler stops, and the chance of winning each bet. Each change starts the games again.")}>
            <Slider label={L("Starting money")} min={1} max={49} step={1} value={start} format={(v) => String(Math.round(v))} onChange={(v) => { const s = Math.round(v); setStart(s); if (s >= target) setTarget(s + 1); reset(); }} />
            <Slider label={L("Target: the gambler stops on reaching it")} min={2} max={50} step={1} value={target} format={(v) => String(Math.round(v))} onChange={(v) => { const t = Math.round(v); setTarget(t); if (start >= t) setStart(t - 1); reset(); }} />
            <Slider label={L("Chance of winning each bet")} min={0.4} max={0.6} step={0.01} value={p} format={(v) => v.toFixed(2)} onChange={(v) => { setP(Math.round(v * 100) / 100); reset(); }} />
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={tally.games}
          limit={limit}
          what={L("games")}
          onLimit={(v) => setLimit(Math.round(v))}
          limitRange={{ min: 10, max: 5000, step: 10 }}
          onToggle={() => {
            if (!runner.running && tally.games >= limit) reset();
            runner.toggle();
          }}
          onStep={(many) => runner.once(many)}
          onReset={reset}
          perFrame={perFrame}
          onSpeed={setPerFrame}
          pace="slow"
        />
      }
      picture={
        <section ref={stage}>
          <Text kind="note" as="div" className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
            <span><Swatch colour={SKY} />{L("The last twelve games")}</span>
            <span><Swatch colour={ONE} />{L("Share of games that reached the target")}</span>
            <span><Swatch colour={TWO} />{L("Dashed line: chance by the formula")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[tally, start, target, p, limit]}
              draw={(pen) => {
                const [a, b] = split(pen, [1, 1]);
                const games = pane(pen, a, { x0: 0, x1: longest, y0: 0, y1: target });
                frame(pen, games, { y: target <= 20 ? 5 : 10 });
                line(pen, games, [[0, target], [longest, target]], MUTED, 1);
                tally.paths.forEach((q, i) => {
                  const last = i === tally.paths.length - 1;
                  pen.ctx.globalAlpha = last ? 1 : 0.5;
                  line(pen, games, q.map((v, j) => [j, v]), last ? INK : SKY, last ? 2 : 1);
                });
                pen.ctx.globalAlpha = 1;
                const sh = pane(pen, b, { x0: 0, x1: limit, y0: 0, y1: 1 });
                frame(pen, sh, { x: limit / 4, y: 0.25 });
                pen.ctx.setLineDash([5, 4]);
                line(pen, sh, [[0, chance], [limit, chance]], TWO, 1.6);
                pen.ctx.setLineDash([]);
                line(pen, sh, tally.share, ONE, 2);
              }}
            />
          </div>
          <Caption>
            {L("First picture (on the left, or on top on a narrow screen): the last twelve games. Across is the number of bets, up is the gambler's money, between zero and the target. The newest game is the thickest line. Second picture: the share of games so far that reached the target, across the games played. The dashed line is the chance given by the formula.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={tally.games >= 500 ? Math.abs(share - chance) < 0.04 : undefined}>
            {tally.games === 0
              ? L("No game yet. From {{s}} to {{t}} with a chance of {{p}} of winning each bet, the formula gives {{c}} for reaching {{t}}, after {{b}} bets on average.", { s: start, t: target, p: p.toFixed(2), c: chance.toFixed(3), b: bets.toFixed(1) })
              : L("Of {{g}} games, {{w}} reached {{t}}: a share of {{s}}, against {{c}} by the formula. The games lasted {{m}} bets on average, against {{b}} by the formula.", { g: tally.games, w: tally.won, t: target, s: share.toFixed(3), c: chance.toFixed(3), m: (tally.bets / tally.games).toFixed(1), b: bets.toFixed(1) })}
          </Verdict>
          <Readout
            rows={[
              [L("Starting money and target"), `${start} -> ${target}`],
              [L("Chance of winning each bet"), p.toFixed(2)],
              [L("Games played"), String(tally.games)],
              [L("Share of games that reached the target"), tally.games ? share.toFixed(3) : "-"],
              [L("Chance of reaching the target, by the formula"), chance.toFixed(4)],
              [L("Average number of bets per game, measured"), tally.games ? (tally.bets / tally.games).toFixed(1) : "-"],
              [L("Average number of bets per game, by the formula"), bets.toFixed(1)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The formula comes from the first bet. From 10, the chance of reaching the target is p times the chance from 11, plus 1 - p times the chance from 9, where p is the chance of winning a bet. Solving these equations gives start divided by target for a fair coin. For other coins it gives (1 - r^start)/(1 - r^target), where r = (1 - p)/p. A small bias against the gambler adds up over many bets. With a 49 per cent coin, from 10 to 20 the chance is 0.40, and from 100 to 200 it is only 0.018. The money of an insurance company follows the same picture, with premiums as wins and claims as losses.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`probability-ruin-${start}-${target}-${p.toFixed(2)}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
