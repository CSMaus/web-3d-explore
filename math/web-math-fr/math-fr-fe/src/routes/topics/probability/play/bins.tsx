import { createFileRoute } from "@tanstack/react-router";
import { Swatch, Text } from "@kit/index";
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
import { GROUND, INK, MUTED, ONE, SKY, blend } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, block, frame, line, pane } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import * as scene from "@/scenes/probability/bins";
import type { Values } from "@/scenes/probability/bins";
import { STEPS } from "@/storylines/probability/bins";
import type { Act } from "@/storylines/probability/bins";
import { BINS, beyond, density, histogram, samples, shareAbove, type Shape } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/bins")({
  loader: () => api.system(TOPIC, "bins"),
  component: BinsPage,
});

const COUNT = 10000;
const SPAN = 50;

function storyAct(act: Act, values: Values, change: (next: Values) => void) {
  switch (act) {
    case "cut":
      return (
        <div className="max-w-2xl">
          <Slider label={L("Border, in minutes")} min={0} max={SPAN} step={1} value={values.cut} format={(v) => String(Math.round(v))} onChange={(v) => change({ cut: Math.round(v) })} />
        </div>
      );
  }
}
const SHAPES: { id: Shape; label: string }[] = [
  { id: "exponential", label: L("Taxis at random") },
  { id: "uniform", label: L("A bus every 20 minutes") },
  { id: "normal", label: L("About 10 minutes, give or take 3") },
];

/**
 * 10,000 waiting times from one seed, counted in bins over 0 to 50 minutes. each step of the run
 * narrows the bins; every bar's height is its count divided by the count and the bin's width, so the
 * bars keep their height as they narrow and close on the density curve. the bars past the chosen
 * wait are lit, and their area is the chance of waiting that long.
 */
function BinsPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [shape, setShape] = useState<Shape>("exponential");
  const [wait, setWait] = useState(20);
  const [perFrame, setPerFrame] = useState(0.08);
  const [k, setK] = useState(0);
  const last = BINS.length - 1;
  const runner = useRunner((s) => setK(Math.min(last, s)), { perFrame, stopAt: last });
  const values = useMemo(() => samples(shape, COUNT, 1), [shape]);
  const bins = BINS[k];
  const width = SPAN / bins;
  const counts = useMemo(() => histogram(values, 0, SPAN, bins), [values, bins]);
  const heights = counts.map((c) => c / (COUNT * width));
  const measured = shareAbove(values, wait);
  const exact = beyond(shape, wait);
  const barArea = counts.reduce((s, c, i) => s + (i * width >= wait ? c : 0), 0) / COUNT;
  const reset = () => {
    runner.reset();
    setK(0);
  };

  return (
    <TaskPage
      title={system?.name ?? L("From bars to a curve: waits for a taxi")}
      job={L("Taxis come at random, 10 minutes apart on average. How often is the wait over 20 minutes?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("How the waits arise")} note={L("Taxis at random: the curve falls steadily, and it is called the exponential curve. A bus every 20 minutes, reached at a random moment: the average wait is also 10 minutes, and the curve is flat from 0 to 20. About 10 minutes, give or take 3: the curve is a bell, called the normal curve.")}>
            <Choices options={SHAPES} value={shape} onPick={(id) => { setShape(id); reset(); }} />
          </OptionGroup>
          <OptionGroup title={L("The chosen wait")} note={L("The bars to the right of this wait are lit. Their area is the share of waits longer than it.")}>
            <Slider label={L("Waits longer than this many minutes")} min={0} max={40} step={1} value={wait} format={(v) => String(Math.round(v))} onChange={(v) => setWait(Math.round(v))} />
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={k}
          limit={last}
          what={L("narrowings")}
          onToggle={() => {
            if (!runner.running && k >= last) reset();
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
            <span><Swatch colour={SKY} />{L("Bars: share of waits per minute of bin width")}</span>
            <span><Swatch colour={ONE} />{L("Lit bars: waits longer than the chosen wait")}</span>
            <span><Swatch colour={INK} />{L("Thick line: the density curve")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[heights, wait, shape]}
              draw={(pen) => {
                const top = shape === "normal" ? 0.16 : 0.12;
                const g = pane(pen, UNIT, { x0: 0, x1: SPAN, y0: 0, y1: top });
                frame(pen, g, { x: 5, y: 0.02 });
                heights.forEach((h, i) => {
                  const from = i * width;
                  block(pen, g, from + width * 0.04, 0, from + width * 0.96, Math.min(top, h), from >= wait ? ONE : blend(GROUND, SKY, 0.6));
                });
                const pts: [number, number][] = [];
                for (let i = 0; i <= 500; i += 1) {
                  const x = (i / 500) * SPAN;
                  pts.push([x, Math.min(top, density(shape, x))]);
                }
                line(pen, g, pts, INK, 2);
                line(pen, g, [[wait, 0], [wait, top]], MUTED, 1);
              }}
            />
          </div>
          <Caption>
            {L("Across: the wait in minutes, from 0 to 50. Up: for each bin, the number of waits in it divided by 10,000 and by the width of the bin in minutes. With this height, the area of a bar is the share of waits in its bin. The thick line is the curve the bars approach, called the density curve. The thin upright line marks the chosen wait.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={k >= 10 ? Math.abs(measured - exact) < 0.01 : undefined}>
            {L("With {{b}} bins of {{w}} minutes each, a share of {{m}} of the 10,000 waits is longer than {{t}} minutes. The area under the curve to the right of {{t}} minutes is {{e}}.", { b: bins, w: width < 1 ? width.toFixed(2) : width.toFixed(1), m: measured.toFixed(4), t: wait, e: exact.toFixed(4) })}
          </Verdict>
          <Readout
            rows={[
              [L("Number of bins"), String(bins)],
              [L("Width of each bin"), L("{{w}} min", { w: width.toFixed(2) })],
              [L("Fewest and most waits in a bin"), `${Math.min(...counts)}, ${Math.max(...counts)}`],
              [L("Share of waits longer than the chosen wait"), measured.toFixed(4)],
              [L("Area of the lit bars"), barArea.toFixed(4)],
              [L("Area under the curve past the chosen wait"), exact.toFixed(4)],
              [L("Area past 20 minutes for taxis at random"), `e^-2 = ${Math.exp(-2).toFixed(4)}`],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("A curve like this is called a density. Its height is not a chance. An area under it is a chance. A wait of exactly 20 minutes, not a fraction of a second more or less, has chance zero. A range of waits, such as more than 20 minutes, has a chance equal to the area over that range. For taxis at random the area past 20 minutes is e^-2 = 0.135, about one wait in seven, where e = 2.718... is a constant and e^-2 is 1 divided by e twice. The bus every 20 minutes has the same average wait and never makes anyone wait more than 20 minutes. With very narrow bins the bars get ragged again, because each bin holds few waits. 10,000 waits are enough for about 50 bins over 50 minutes.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`probability-bins-${shape}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
