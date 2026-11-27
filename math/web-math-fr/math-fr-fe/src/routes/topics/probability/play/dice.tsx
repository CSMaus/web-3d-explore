import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
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
import { EDGE, INK, MUTED, ONE, SKY, blend, GROUND } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, block, frame, label, line, pane, split } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import * as scene from "@/scenes/probability/dice";
import type { Values } from "@/scenes/probability/dice";
import { STEPS } from "@/storylines/probability/dice";
import type { Act } from "@/storylines/probability/dice";
import { rngFrom, sumWays, throwTwo } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/dice")({
  loader: () => api.system(TOPIC, "dice"),
  component: DicePage,
});

const MOST = 10000;
const SUMS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const OPTIONS = SUMS.map((s) => ({ id: String(s), label: String(s) }));

function storyAct(act: Act, values: Values, change: (next: Values) => void) {
  switch (act) {
    case "sum":
      return (
        <OptionGroup title={L("Sum of the two dice")} note={L("Each button lights the cells of the grid that give that sum.")}>
          <Choices options={OPTIONS} value={String(values.sum)} onPick={(id) => change({ sum: Number(id) })} />
        </OptionGroup>
      );
  }
}

/**
 * two dice thrown again and again from one seeded list. on the left the 36 equally likely pairs,
 * with the pairs of the chosen sum lit and the last throw ringed; on the right the share of each
 * sum so far, over the shares the grid predicts.
 */
function DicePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [watch, setWatch] = useState(7);
  const [guess, setGuess] = useState(2);
  const [limit, setLimit] = useState(1000);
  const [perFrame, setPerFrame] = useState(2);
  const [n, setN] = useState(0);
  const runner = useRunner((k) => setN(Math.min(limit, k)), { perFrame, stopAt: limit });
  const rolls = useMemo(() => {
    const rng = rngFrom(1);
    return Array.from({ length: MOST }, () => throwTwo(rng));
  }, []);
  const counts = useMemo(() => {
    const c = new Array(13).fill(0);
    for (let i = 0; i < n; i += 1) c[rolls[i][0] + rolls[i][1]] += 1;
    return c;
  }, [rolls, n]);
  const last = n > 0 ? rolls[n - 1] : null;
  const share = n ? counts[watch] / n : 0;
  const exact = sumWays(watch) / 36;
  const ratio = counts[2] ? counts[7] / counts[2] : null;
  const top = Math.max(0.2, ...SUMS.map((s) => (n ? counts[s] / n : 0))) * 1.08;

  const reset = () => {
    runner.reset();
    setN(0);
  };

  return (
    <TaskPage
      title={system?.name ?? L("Two dice: why 7 comes up six times as often as 2")}
      job={L("When two dice are thrown, why does a sum of 7 come up six times as often as a sum of 2?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("A guess first")} note={L("How many times as often does 7 come up as 2 in a long run of throws? After the run, the result compares the guess with the throws and with the count of pairs.")}>
            <Slider label={L("Guess: how many times as often 7 comes up as 2")} min={1} max={12} step={0.5} value={guess} format={(v) => v.toFixed(1)} onChange={setGuess} />
          </OptionGroup>
          <OptionGroup title={L("The sum to watch")} note={L("Pick one sum from 2 to 12. Its pairs light up on the grid, and its bar is marked among the throws. The sum 7 lights six cells. The sums 2 and 12 light one cell each.")}>
            <Choices options={OPTIONS} value={String(watch)} onPick={(id) => setWatch(Number(id))} />
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={n}
          limit={limit}
          what={L("throws")}
          onLimit={(v) => setLimit(Math.round(v))}
          limitRange={{ min: 10, max: MOST, step: 10 }}
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
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[counts, watch, last, n]}
              draw={(pen) => {
                const [left, right] = split(pen, [2, 3]);
                const grid = pane(pen, left, { x0: 0.5, x1: 6.5, y0: 0.5, y1: 6.5 });
                frame(pen, grid, { x: 1, y: 1 });
                for (let a = 1; a <= 6; a += 1) {
                  for (let b = 1; b <= 6; b += 1) {
                    const on = a + b === watch;
                    block(pen, grid, a - 0.44, b - 0.44, a + 0.44, b + 0.44, on ? blend(GROUND, ONE, 0.75) : blend(GROUND, EDGE, 0.6));
                    label(pen, grid, String(a + b), a, b - 0.12, on ? GROUND : MUTED, "center");
                  }
                }
                if (last) {
                  const [a, b] = grid.at(last[0], last[1]);
                  pen.ring(a, b, 12, INK, 2);
                }
                const bars = pane(pen, right, { x0: 1.4, x1: 12.6, y0: 0, y1: top });
                frame(pen, bars, { x: 1, xFormat: (v) => (v >= 2 ? String(v) : "") });
                for (const s of SUMS) {
                  const h = n ? counts[s] / n : 0;
                  block(pen, bars, s - 0.38, 0, s + 0.38, h, s === watch ? ONE : blend(GROUND, SKY, 0.45));
                }
                line(pen, bars, SUMS.map((s) => [s, sumWays(s) / 36]), INK, 1.6);
                SUMS.forEach((s) => {
                  const [a, b] = bars.at(s, sumWays(s) / 36);
                  pen.dot(a, b, 3, INK);
                });
              }}
            />
          </div>
          <Caption>
            {L("First picture (on the left, or on top on a narrow screen): a grid of the 36 pairs. Across is the first die, from 1 to 6, and up is the second die. Each cell shows the sum of its pair. The cells of the chosen sum are lit, and a ring marks the last throw. Second picture: one bar for each sum from 2 to 12. The height of a bar is the share of the throws so far that gave that sum. The line with dots is the share of the grid: the number of cells of each sum divided by 36. Over many throws the bars come close to the line.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={n >= 1000 ? Math.abs(share - exact) < 0.02 : undefined}>
            {n === 0
              ? L("No throw yet. The grid already gives the share that the throws should settle on: the sum {{s}} has {{w}} of the 36 cells, a share of {{e}}.", { s: watch, w: sumWays(watch), e: exact.toFixed(4) })
              : L("After {{n}} throws, the sum {{s}} came up {{k}} times, a share of {{share}} of the throws. On the grid it has {{w}} cells out of 36, a share of {{e}}. The two shares differ by {{gap}}.", { n, s: watch, k: counts[watch], share: share.toFixed(4), w: sumWays(watch), e: exact.toFixed(4), gap: Math.abs(share - exact).toFixed(4) })}
          </Verdict>
          <Readout
            rows={[
              [L("Throws so far"), String(n)],
              [L("Sum being watched"), String(watch)],
              [L("Times this sum came up"), String(counts[watch])],
              [L("Share of the throws that gave this sum"), share.toFixed(4)],
              [L("Share of the grid: cells of this sum out of 36"), `${sumWays(watch)}/36 = ${exact.toFixed(4)}`],
              [L("Throws of 7 divided by throws of 2"), ratio === null ? L("No 2 thrown yet") : `${ratio.toFixed(2)}`],
              [L("Cells of 7 divided by cells of 2"), "6/1 = 6"],
              [L("Guess: how many times as often 7 comes up as 2"), guess.toFixed(1)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The chance of an event is a number from 0 to 1 that says how often it happens over many tries: 0 means never, 1 means always. When all outcomes are equally likely, the chance of an event is its share of the outcomes. So the chance of the sum 7 is 6/36. After 100 throws the bars are still off the line by several hundredths. After 10,000 throws they sit on it. The computer makes the throws with a fixed rule that imitates chance, so a run gives the same numbers every time. The page assumes fair dice, on which every face is equally likely.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`probability-dice-${watch}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
