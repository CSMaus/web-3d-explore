import { createFileRoute } from "@tanstack/react-router";
import { Swatch, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Equations } from "@/components/Equations";
import { OptionGroup } from "@/components/OptionGroup";
import { Plot } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { EDGE, GROUND, INK, SKY, TWO, blend } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, block, frame, label, pane, split } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import { bayes, counted, population } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/test")({
  loader: () => api.system(TOPIC, "test"),
  component: TestPage,
});

const PEOPLE = 100000;
const COLS = 500;
const ROWS = 200;
/** one step tests this many people, two rows of the block */
const BATCH = 1000;
const STEPS = PEOPLE / BATCH;

/**
 * 100,000 people as a block of 500 by 200, tested two rows a step. every positive result is lit as it
 * comes, the ill in one colour and the healthy in another, and beside the block the two counts of
 * positives grow. the counts are exactly the population's shares; only where each person stands is random.
 */
function TestPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [perThousand, setPerThousand] = useState(1);
  const [sensitivity, setSensitivity] = useState(99);
  const [falsePositive, setFalsePositive] = useState(5);
  const [guess, setGuess] = useState(90);
  const [perFrame, setPerFrame] = useState(0.5);
  const [k, setK] = useState(0);
  const runner = useRunner((s) => setK(Math.min(STEPS, s)), { perFrame, stopAt: STEPS });
  const screen = useMemo(() => ({ people: PEOPLE, prevalence: perThousand / 1000, sensitivity: sensitivity / 100, falsePositive: falsePositive / 100 }), [perThousand, sensitivity, falsePositive]);
  const kinds = useMemo(() => population(screen, 3), [screen]);
  const all = counted(screen);
  const tested = k * BATCH;
  const sofar = useMemo(() => {
    const c = [0, 0, 0, 0];
    for (let i = 0; i < tested; i += 1) c[kinds[i]] += 1;
    return c;
  }, [kinds, tested]);
  const positives = sofar[1] + sofar[3];
  const share = positives ? sofar[3] / positives : 0;
  const reset = () => {
    runner.reset();
    setK(0);
  };
  const change = (f: (v: number) => void) => (v: number) => {
    f(v);
    reset();
  };

  return (
    <TaskPage
      title={system?.name ?? L("A positive test")}
      job={L("A person takes a test for a disease, and the result is positive: the test says the person is ill. What is the chance that the person really is ill? The test finds 99 per cent of the people who have the disease. It also wrongly says 'ill' for 5 per cent of healthy people. One person in 1000 has the disease. First set a guess. Then, instead of using a formula, count. Take 100,000 people: 100 of them are ill and 99,900 are healthy. Press run to test them, a thousand people a step. Then look only at the people with a positive result. The chance of being ill, once the result is known to be positive, is the share of ill people among them.")}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("A guess first")} note={L("Set the chance, in per cent, that a person with a positive result is ill. The result compares the guess with the count.")}>
            <Slider label={L("Guess: chance of being ill after a positive result")} min={0} max={100} step={1} value={guess} format={(v) => `${Math.round(v)}%`} onChange={(v) => setGuess(Math.round(v))} />
          </OptionGroup>
          <OptionGroup title={L("The disease and the test")} note={L("Three sliders set the situation: how many people in 1000 have the disease, the share of ill people the test finds, and the share of healthy people it wrongly calls ill. Each change starts the count again.")}>
            <Slider label={L("People with the disease, per 1000")} min={0.5} max={50} step={0.5} value={perThousand} format={(v) => v.toFixed(1)} onChange={change(setPerThousand)} />
            <Slider label={L("Ill people the test finds")} min={50} max={100} step={1} value={sensitivity} format={(v) => `${Math.round(v)}%`} onChange={change(setSensitivity)} />
            <Slider label={L("Healthy people the test wrongly calls ill")} min={0} max={20} step={0.5} value={falsePositive} format={(v) => `${v.toFixed(1)}%`} onChange={change(setFalsePositive)} />
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={tested}
          limit={PEOPLE}
          what={L("people tested")}
          onToggle={() => {
            if (!runner.running && k >= STEPS) reset();
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
            <span><Swatch colour={TWO} />{L("Ill, positive result")}</span>
            <span><Swatch colour={SKY} />{L("Healthy, positive result")}</span>
            <span><Swatch colour={INK} />{L("Ill, missed by the test")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[kinds, tested, sofar]}
              draw={(pen) => {
                const [left, right] = split(pen, [3, 1]);
                const crowd = pane(pen, left, { x0: 0, x1: COLS, y0: 0, y1: ROWS });
                frame(pen, crowd, { x: 100, y: 50 });
                block(pen, crowd, 0, 0, COLS, ROWS, blend(GROUND, EDGE, 0.35));
                const done = tested / COLS;
                if (done > 0) block(pen, crowd, 0, ROWS - done, COLS, ROWS, blend(GROUND, EDGE, 0.8));
                // the ill are marked from the start, faint until they are tested; positives light as they are found
                const cell = (i: number, colour: string, grow = 0) => {
                  const x = i % COLS;
                  const y = ROWS - 1 - Math.floor(i / COLS);
                  block(pen, crowd, x - grow, y - grow, x + 1 + grow, y + 1 + grow, colour);
                };
                for (let i = tested; i < PEOPLE; i += 1) if (kinds[i] >= 2) cell(i, blend(GROUND, TWO, 0.45), 0.6);
                for (let i = 0; i < tested; i += 1) {
                  const t = kinds[i];
                  if (t === 1) cell(i, SKY);
                  else if (t === 3) cell(i, TWO, 1.2);
                  else if (t === 2) cell(i, INK, 1.2);
                }
                const top = Math.max(10, all.positive) * 1.1;
                const bars = pane(pen, right, { x0: 0, x1: 3, y0: 0, y1: top });
                frame(pen, bars, { x: 1, xFormat: () => "", y: undefined, yFormat: (v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : String(v)) });
                block(pen, bars, 0.4, 0, 1.4, sofar[3], TWO);
                block(pen, bars, 1.6, 0, 2.6, sofar[1], SKY);
                label(pen, bars, String(sofar[3]), 0.9, sofar[3] + top * 0.02, INK, "center");
                label(pen, bars, String(sofar[1]), 2.1, sofar[1] + top * 0.02, INK, "center");
              }}
            />
          </div>
          <Caption>
            {L("First picture (on the left, or on top on a narrow screen): the 100,000 people as small squares, 500 across and 200 down. The testing starts at the top and goes down two rows a step. Ill people are marked faintly before their test. Once tested, every positive result lights up, and so does every ill person the test missed. Second picture: two bars count the positive results so far, ill people on the left bar and healthy people on the right.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={k >= STEPS ? Math.abs(guess / 100 - all.share) < 0.05 : undefined}>
            {k === 0
              ? L("Nobody is tested yet. Of these 100,000 people {{ill}} are ill. The guess is {{g}} per cent. Press run to test a thousand people a step.", { ill: all.ill, g: guess })
              : k < STEPS
                ? L("{{t}} people tested. Of the positive results, {{a}} belong to ill people and {{b}} to healthy people. So far, {{s}} per cent of the people with a positive result are ill.", { t: tested.toLocaleString("en"), a: sofar[3], b: sofar[1], s: (share * 100).toFixed(2) })
                : L("All 100,000 people are tested: {{a}} ill people tested positive, and so did {{b}} healthy ones. Of the {{p}} positives, {{s}} per cent are ill. The guess was {{g}} per cent.", { a: all.illPositive, b: all.healthyPositive.toLocaleString("en"), p: all.positive.toLocaleString("en"), s: (all.share * 100).toFixed(2), g: guess })}
          </Verdict>
          <Readout
            rows={[
              [L("People with the disease"), all.ill.toLocaleString("en")],
              [L("People without the disease"), all.healthy.toLocaleString("en")],
              [L("Ill people with a positive result, once all are tested"), all.illPositive.toLocaleString("en")],
              [L("Healthy people with a positive result, once all are tested"), all.healthyPositive.toLocaleString("en")],
              [L("Share of ill people among the positive results"), `${all.illPositive} / ${all.positive.toLocaleString("en")} = ${(all.share * 100).toFixed(2)}%`],
              [L("The same share by Bayes' rule, a formula, unrounded"), `${(bayes(screen) * 100).toFixed(2)}%`],
              [L("Chance of being ill before any test"), `${(screen.prevalence * 100).toFixed(2)}%`],
              [L("Guess: chance of being ill after a positive result"), `${guess}%`],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The usual guess is 99 per cent. That number answers another question: how likely a positive result is for a person who is ill. The question of this page is the reverse: how likely the disease is for a person with a positive result. Healthy people are so many that their 5 per cent of false alarms, 4,995 people, far outnumber the 99 ill people with a positive result. With 10 ill people in 1000, the share of ill people among the positives rises to 16.7 per cent. Bayes' rule is a formula that gives the same answer. It is this count with every number divided by the number of people.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name="probability-test" />
          <Equations system={system} />
        </>
      }
    />
  );
}
