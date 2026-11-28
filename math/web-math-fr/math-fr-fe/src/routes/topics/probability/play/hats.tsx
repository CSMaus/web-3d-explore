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
import { GROUND, INK, MUTED, ONE, SKY, blend } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, block, dot, frame, line, pane, split } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import * as scene from "@/scenes/probability/hats";
import type { Values } from "@/scenes/probability/hats";
import { STEPS } from "@/storylines/probability/hats";
import type { Act } from "@/storylines/probability/hats";
import { matchChance, matches, rngFrom, shuffleHats } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/hats")({
  loader: () => api.system(TOPIC, "hats"),
  component: HatsPage,
});

const MOST = 5000;
const SHOWN = 8;

function storyAct(act: Act, values: Values, change: (next: Values) => void) {
  switch (act) {
    case "shuffle":
      return (
        <Button variant="outline" size="sm" onClick={() => change({ seed: values.seed + 1 })}>
          {L("Shuffle the hats")}
        </Button>
      );
  }
}

/**
 * n hats handed back in a random order, shuffle after shuffle from one seed. on the left the shuffle
 * in view, person against the hat received, the matches on the diagonal; on the right how often each
 * number of matches has come up, over the exact chances.
 */
function HatsPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [hats, setHats] = useState(10);
  const [guess, setGuess] = useState(2);
  const [limit, setLimit] = useState(1000);
  const [perFrame, setPerFrame] = useState(2);
  const [n, setN] = useState(0);
  const runner = useRunner((k) => setN(Math.min(limit, k)), { perFrame, stopAt: limit });
  const shuffles = useMemo(() => {
    const rng = rngFrom(hats);
    return Array.from({ length: MOST }, () => shuffleHats(hats, rng));
  }, [hats]);
  const tally = useMemo(() => {
    const by = new Array(SHOWN + 1).fill(0);
    let total = 0;
    for (let i = 0; i < n; i += 1) {
      const m = matches(shuffles[i]);
      total += m;
      by[Math.min(SHOWN, m)] += 1;
    }
    return { by, total };
  }, [shuffles, n]);
  const now = n > 0 ? shuffles[n - 1] : null;
  const exact = Array.from({ length: SHOWN + 1 }, (_, k) => (k < SHOWN ? matchChance(hats, k) : Array.from({ length: hats - SHOWN + 1 }, (_, j) => matchChance(hats, SHOWN + j)).reduce((s, v) => s + v, 0)));
  const reset = () => {
    runner.reset();
    setN(0);
  };
  const average = n ? tally.total / n : 0;

  return (
    <TaskPage
      title={system?.name ?? L("Hats handed back at random")}
      job={L("Hats come back at random. How many people get their own?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("A guess first")} note={L("Set the average number of people who get their own hat back. The result compares the guess with the shuffles.")}>
            <Slider label={L("Average number of people with their own hat")} min={0} max={10} step={0.5} value={guess} format={(v) => v.toFixed(1)} onChange={setGuess} />
          </OptionGroup>
          <OptionGroup title={L("People and hats")} note={L("From 2 people to 100, each with one hat. Changing the number starts the shuffles again.")}>
            <Slider label={L("Number of people and hats")} min={2} max={100} step={1} value={hats} format={(v) => String(Math.round(v))} onChange={(v) => { setHats(Math.round(v)); reset(); }} />
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={n}
          limit={limit}
          what={L("shuffles")}
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
          pace="slow"
        />
      }
      picture={
        <section ref={stage}>
          <Text kind="note" as="div" className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
            <span><Swatch colour={ONE} />{L("Dot: a person with their own hat")}</span>
            <span><Swatch colour={SKY} />{L("Bars: share of shuffles with that many matches")}</span>
            <span><Swatch colour={INK} />{L("Dots: the exact chance")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[now, tally, hats]}
              draw={(pen) => {
                const [a, b] = split(pen, [1, 1]);
                const who = pane(pen, a, { x0: 0.5, x1: hats + 0.5, y0: 0.5, y1: hats + 0.5 });
                frame(pen, who, { x: hats <= 10 ? 1 : hats <= 40 ? 5 : 20, y: hats <= 10 ? 1 : hats <= 40 ? 5 : 20 });
                line(pen, who, [[0.5, 0.5], [hats + 0.5, hats + 0.5]], MUTED, 1);
                const r = Math.max(2, Math.min(7, 120 / hats));
                if (now) now.forEach((h, i) => dot(pen, who, i + 1, h + 1, h === i ? r * 1.4 : r, h === i ? ONE : blend(GROUND, INK, 0.55)));
                const top = Math.max(0.45, ...tally.by.map((c) => (n ? c / n : 0)), ...exact) * 1.1;
                const bars = pane(pen, b, { x0: -0.6, x1: SHOWN + 0.6, y0: 0, y1: top });
                frame(pen, bars, { x: 1, y: 0.1, xFormat: (v) => (v === SHOWN ? `${SHOWN}+` : String(v)) });
                tally.by.forEach((c, k) => block(pen, bars, k - 0.35, 0, k + 0.35, n ? c / n : 0, SKY));
                exact.forEach((p, k) => dot(pen, bars, k, p, 3.5, INK));
              }}
            />
          </div>
          <Caption>
            {L("First picture (on the left, or on top on a narrow screen): the latest shuffle. Each person is a column, numbered across. The dot in a column sits at the number of the hat that person received. A dot on the diagonal line is a person with their own hat, called a match. Second picture: one bar for each number of matches, 0, 1, 2 and so on, with 8 or more in the last bar. The height of a bar is the share of shuffles so far with that many matches. The dots are the exact chances.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={n >= 500 ? Math.abs(average - 1) < 0.1 : undefined}>
            {n === 0
              ? L("No shuffle yet. With {{h}} hats, each person gets their own hat with chance 1 in {{h}}, so the average should be {{h}} x 1/{{h}} = 1. The guess is {{g}}.", { h: hats, g: guess.toFixed(1) })
              : L("After {{n}} shuffles of {{h}} hats, the number of people who got their own hat averaged {{m}}. In a share of {{z}} of the shuffles nobody got their own hat. The exact chance of that is {{ez}}.", { n, h: hats, m: average.toFixed(3), z: (tally.by[0] / n).toFixed(3), ez: exact[0].toFixed(3) })}
          </Verdict>
          <Readout
            rows={[
              [L("Number of people and hats"), String(hats)],
              [L("Shuffles so far"), String(n)],
              [L("People with their own hat in the latest shuffle"), now ? String(matches(now)) : "-"],
              [L("Average number of people with their own hat"), n ? average.toFixed(3) : "-"],
              [L("Expected average: 1/n for each of n people, added"), `${hats} x 1/${hats} = 1`],
              [L("Share of shuffles where nobody got their own hat"), n ? (tally.by[0] / n).toFixed(3) : "-"],
              [L("Exact chance that nobody gets their own hat"), exact[0].toFixed(4)],
              [L("Guess: average number of people with their own hat"), guess.toFixed(1)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The count works like this. Give each person a number: 1 for their own hat and 0 otherwise. The number of matches is the sum of these numbers. The average of a sum is the sum of the averages, even when the parts depend on each other. That is why the answer is 1 for 3 hats and for 100. The chance that nobody gets their own hat is 1/3 for 3 hats. From about 10 hats on it stays at 0.368, which is 1/e, where e = 2.718... is a constant that often appears in chance.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`probability-hats-${hats}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
