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
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { GROUND, ONE, SKY, blend } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, block, frame, line, pane } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import { histogram, mean, remaining, samples, shareAbove, type Shape } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/memory")({
  loader: () => api.system(TOPIC, "memory"),
  component: MemoryPage,
});

const COUNT = 10000;
const BATCH = 100;
const STEPS = COUNT / BATCH;
const SPAN = 40;
const BINS = 20;
const WAYS: { id: Shape; label: string }[] = [
  { id: "exponential", label: L("Taxis at random") },
  { id: "uniform", label: L("A bus every 20 minutes") },
];

/**
 * waiting times arriving a hundred at a time. one histogram counts every wait from the start; the
 * other keeps only the people who have already waited the chosen time and counts what is still ahead
 * of them. for random arrivals the two shapes are one; for a timetable they are not.
 */
function MemoryPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [way, setWay] = useState<Shape>("exponential");
  const [waited, setWaited] = useState(10);
  const [perFrame, setPerFrame] = useState(0.5);
  const [k, setK] = useState(0);
  const runner = useRunner((s) => setK(Math.min(STEPS, s)), { perFrame, stopAt: STEPS });
  const all = useMemo(() => samples(way, COUNT, 1), [way]);
  const n = k * BATCH;
  const seen = useMemo(() => all.subarray(0, n), [all, n]);
  const ahead = useMemo(() => remaining(seen, waited), [seen, waited]);
  const w = SPAN / BINS;
  const fromStart = histogram(seen, 0, SPAN, BINS).map((c) => (n ? c / (n * w) : 0));
  const stillAhead = histogram(ahead, 0, SPAN, BINS).map((c) => (ahead.length ? c / (ahead.length * w) : 0));
  const reset = () => {
    runner.reset();
    setK(0);
  };
  const meanStart = mean(seen);
  const meanAhead = mean(ahead);

  return (
    <TaskPage
      title={system?.name ?? L("Waiting that forgets the past")}
      job={L("Taxis arrive at random moments, 10 minutes apart on average. A person has already waited 10 minutes. How long is the wait still ahead? It feels as though a taxi must be due soon. In fact the wait still ahead is 10 minutes on average, the same as at the start. Press run to collect waits, a hundred at a time. The page keeps only the people who waited at least 10 minutes and measures the time still ahead of them. Then switch to a bus that comes every 20 minutes on a timetable. Its average wait is also 10 minutes, but after 10 minutes of waiting only 5 are left on average.")}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("How the arrivals come")} note={L("Taxis at random follow no schedule, so the time already waited says nothing about when the next one comes. A bus every 20 minutes keeps a schedule, so every minute waited brings the bus closer. Changing the choice starts the count again.")}>
            <Choices options={WAYS} value={way} onPick={(id) => { setWay(id); reset(); }} />
          </OptionGroup>
          <OptionGroup title={L("Time already waited")} note={L("The second count keeps only the people who have waited at least this long and measures the time still ahead of them.")}>
            <Slider label={L("Minutes already waited")} min={0} max={18} step={1} value={waited} format={(v) => String(Math.round(v))} onChange={(v) => setWaited(Math.round(v))} />
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={n}
          limit={COUNT}
          what={L("waits")}
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
            <span><Swatch colour={SKY} />{L("Bars: every wait, from the start")}</span>
            <span><Swatch colour={ONE} />{L("Line: the wait still ahead after the time waited")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[fromStart, stillAhead]}
              draw={(pen) => {
                const top = way === "exponential" ? 0.13 : 0.24;
                const g = pane(pen, UNIT, { x0: 0, x1: SPAN, y0: 0, y1: top });
                frame(pen, g, { x: 5, y: way === "exponential" ? 0.02 : 0.04 });
                fromStart.forEach((h, i) => block(pen, g, i * w + 0.12, 0, (i + 1) * w - 0.12, Math.min(top, h), blend(GROUND, SKY, 0.6)));
                const steps: [number, number][] = [];
                stillAhead.forEach((h, i) => {
                  steps.push([i * w, Math.min(top, h)], [(i + 1) * w, Math.min(top, h)]);
                });
                if (ahead.length) line(pen, g, steps, ONE, 2.6);
              }}
            />
          </div>
          <Caption>
            {L("Across: a wait in minutes. Up: the share of waits in each two-minute bin, divided by the width of the bin, 2 minutes. The bars count every wait from the start. The thick stepped line counts only the people who had already waited the chosen time, and shows the time still ahead of them from that moment. When the two shapes match, the time already waited has changed nothing.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={n >= 2000 && way === "exponential" ? Math.abs(meanAhead - meanStart) < 1 : undefined}>
            {n === 0
              ? L("No wait collected yet. Press run to collect 10,000 waits, a hundred at a time.")
              : L("Of {{n}} waits, {{m}} lasted more than {{t}} minutes. For those people the wait still ahead averaged {{a}} minutes. All the waits, counted from the start, averaged {{s}} minutes.", { n, m: ahead.length, t: waited, a: meanAhead.toFixed(2), s: meanStart.toFixed(2) })}
          </Verdict>
          <Readout
            rows={[
              [L("Waits collected"), String(n)],
              [L("People still waiting after the minutes already waited, and their share"), n ? `${ahead.length}, ${(ahead.length / n).toFixed(3)}` : "-"],
              [L("Average of all waits, from the start"), n ? meanStart.toFixed(2) : "-"],
              [L("Average wait still ahead, for those still waiting"), ahead.length ? meanAhead.toFixed(2) : "-"],
              [L("Share of all waits longer than 10 minutes"), n ? shareAbove(seen, 10).toFixed(3) : "-"],
              [L("Share of those still waiting who wait 10 minutes more"), ahead.length ? shareAbove(ahead, 10).toFixed(3) : "-"],
              [L("Both shares for taxis at random, exact"), `e^-1 = ${Math.exp(-1).toFixed(3)}`],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("For taxis at random, the chance of waiting more than t minutes is e^-t/10, where e = 2.718... is a constant. Take the people still waiting after s minutes. The share of them who wait t minutes more is e^-(s+t)/10 divided by e^-s/10, which is e^-t/10 again. The time already spent cancels out. This kind of waiting time is called exponential, and it is the only kind with this property. The feeling that a taxi must be due after a long wait comes from timetables, and the bus choice shows that on a timetable the feeling is right.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`probability-memory-${way}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
