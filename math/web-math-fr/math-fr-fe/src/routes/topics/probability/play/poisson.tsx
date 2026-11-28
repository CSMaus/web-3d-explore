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
import { StoryOf } from "@/components/StoryOf";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { EDGE, GROUND, INK, ONE, SKY, blend } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, block, dot, frame, pane } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import * as scene from "@/scenes/probability/poisson";
import type { Values } from "@/scenes/probability/poisson";
import { STEPS } from "@/storylines/probability/poisson";
import type { Act } from "@/storylines/probability/poisson";
import { TRIALS, binomial, distance, poisson, rngFrom } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/poisson")({
  loader: () => api.system(TOPIC, "poisson"),
  component: PoissonPage,
});

const SHOWN = 12;
const MEAN_LEAST = 0.5;
const MEAN_MOST = 6;
const MEAN_STEP = 0.5;

function storyAct(act: Act, values: Values, change: (next: Values) => void) {
  switch (act) {
    case "mean":
      return (
        <div className="max-w-2xl">
          <Slider label={L("Average number of calls a minute")} min={MEAN_LEAST} max={MEAN_MOST} step={MEAN_STEP} value={values.mean} format={(v) => v.toFixed(1)} onChange={(v) => change({ mean: v })} />
        </div>
      );
  }
}

/**
 * a minute cut into n slices, a call in each slice with chance mean / n. each step of the run cuts
 * the minute finer: one random minute is drawn as its slices with the calls lit, and the binomial
 * chances of 0, 1, 2 and more calls close on the Poisson chances drawn as dots.
 */
function PoissonPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [mean, setMean] = useState(3);
  const [perFrame, setPerFrame] = useState(0.1);
  const steps = useMemo(() => TRIALS.filter((t) => t >= mean), [mean]);
  const [k, setK] = useState(0);
  const runner = useRunner((s) => setK(Math.min(steps.length - 1, s)), { perFrame, stopAt: steps.length - 1 });
  const n = steps[k];
  const p = mean / n;
  const minute = useMemo(() => {
    const rng = rngFrom(n);
    return Array.from({ length: n }, () => rng() < p);
  }, [n, p]);
  const bin = Array.from({ length: SHOWN + 1 }, (_, j) => binomial(n, j, p));
  const poi = Array.from({ length: SHOWN + 1 }, (_, j) => poisson(j, mean));
  const gap = distance(Array.from({ length: n + 1 }, (_, j) => binomial(n, j, p)), Array.from({ length: Math.max(n + 1, 60) }, (_, j) => poisson(j, mean)));
  const calls = minute.filter(Boolean).length;
  const reset = () => {
    runner.reset();
    setK(0);
  };

  return (
    <TaskPage
      title={system?.name ?? L("Rare events: a minute with no call")}
      job={L("A call centre gets three calls a minute on average. How often does a minute pass with no call?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("Calls a minute on average")} note={L("The average number of calls in a minute stays fixed while the slices get finer. The question above uses 3. Changing it starts the cutting again.")}>
            <Slider label={L("Average calls a minute")} min={1} max={8} step={0.5} value={mean} format={(v) => v.toFixed(1)} onChange={(v) => { setMean(v); reset(); }} />
          </OptionGroup>
          <Text kind="note" as="p">{L("One step cuts the minute into more slices. The cutting starts with a few slices and ends at 1000.")}</Text>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={k}
          limit={steps.length - 1}
          what={L("cuts")}
          onToggle={() => {
            if (!runner.running && k >= steps.length - 1) reset();
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
            <span><Swatch colour={ONE} />{L("A slice with a call")}</span>
            <span><Swatch colour={SKY} />{L("Bars: chances with the minute cut into slices")}</span>
            <span><Swatch colour={INK} />{L("Dots: the Poisson chances")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[minute, n, mean]}
              draw={(pen) => {
                const strip = pane(pen, { x0: 0, x1: 1, y0: 0.82, y1: 1 }, { x0: 0, x1: 60, y0: 0, y1: 1 });
                frame(pen, strip, { x: 10, y: 1, yFormat: () => "" });
                const w = 60 / n;
                minute.forEach((call, i) => block(pen, strip, i * w + (n <= 100 ? w * 0.08 : 0), 0.1, (i + 1) * w - (n <= 100 ? w * 0.08 : 0), 0.9, call ? ONE : blend(GROUND, EDGE, 0.7)));
                const top = Math.max(...bin, ...poi) * 1.15;
                const bars = pane(pen, { x0: 0, x1: 1, y0: 0, y1: 0.78 }, { x0: -0.6, x1: SHOWN + 0.6, y0: 0, y1: top });
                frame(pen, bars, { x: 1, y: 0.05 });
                bin.forEach((c, j) => block(pen, bars, j - 0.34, 0, j + 0.34, c, SKY));
                poi.forEach((c, j) => dot(pen, bars, j, c, 3.5, INK));
              }}
            />
          </div>
          <Caption>
            {L("Top: one random minute, its 60 seconds running across, cut into the slices of this step. A lit slice holds a call. Bottom: the chance of 0, 1, 2 and more calls in a minute. The bars are the chances for this number of slices, when each slice holds a call with chance equal to the average divided by the number of slices. The dots are the Poisson chances, which the bars approach as the slices get finer.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={n >= 100 ? gap < 0.02 : undefined}>
            {L("With the minute cut into {{n}} slices, each holding a call with chance {{p}}, a minute has no call with chance {{b}}. The Poisson chance of no call is e^-{{m}} = {{e}}. The distance between the two lists of chances is {{d}}.", { n, p: p.toFixed(4), b: bin[0].toFixed(4), m: mean, e: poi[0].toFixed(4), d: gap.toFixed(4) })}
          </Verdict>
          <Readout
            rows={[
              [L("Slices in the minute"), String(n)],
              [L("Chance of a call in a slice"), p.toFixed(4)],
              [L("Calls in the random minute shown"), String(calls)],
              [L("Chance of no call, with slices"), `(1 - ${p.toFixed(4)})^${n} = ${bin[0].toFixed(4)}`],
              [L("Chance of no call, Poisson"), poi[0].toFixed(4)],
              [L("Chance of two calls, with slices"), bin[2].toFixed(4)],
              [L("Chance of two calls, Poisson"), poi[2].toFixed(4)],
              [L("Distance between the two lists of chances"), gap.toFixed(4)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("Counts follow the Poisson chances when an event has many chances to happen, each of them small, with a fixed average. The chance of k events is e^-m m^k / k!, where m is the average and k! means 1 x 2 x ... x k. The number e enters through (1 - m/n)^n, the chance of no event in n slices, which comes close to e^-m as n grows. With 3 calls a minute, about one minute in twenty has no call, and two calls in a minute have chance 0.224. The distance between the two lists is half the sum of the differences between their chances. Calls that come in bursts do not follow this rule.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`probability-poisson-${mean}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
