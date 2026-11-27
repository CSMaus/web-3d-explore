import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { useStoryClock } from "@/lib/storyClock";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/dice";
import { STEPS } from "@/storylines/probability/dice";

const meta: Meta = { title: "Scenes/Probability/Dice" };
export default meta;

const DATA = build(DEFAULTS);

function Scene({ id }: { id: string }) {
  const host = useRef<HTMLDivElement | null>(null);
  const clock = useStoryClock(host);
  const step = STEPS.find((s) => s.id === id) ?? STEPS[0];
  const set = applyAct(step.set, DEFAULTS, step.act);
  return (
    <div ref={host} data-slot="plot" className="h-[420px] w-[720px] max-w-full overflow-hidden">
      <Plot
        className="h-full w-full"
        box={UNIT}
        deps={[step, clock.time]}
        draw={(pen) => draw(pen, DATA, step.fade, set, clock.time)}
      />
    </div>
  );
}

export const Hook: StoryObj = { render: () => <Scene id="hook" /> };
export const Why: StoryObj = { render: () => <Scene id="why" /> };
export const One: StoryObj = { render: () => <Scene id="one" /> };
export const Two: StoryObj = { render: () => <Scene id="two" /> };
export const Grid: StoryObj = { render: () => <Scene id="grid" /> };
export const Equal: StoryObj = { render: () => <Scene id="equal" /> };
export const SumTwo: StoryObj = { render: () => <Scene id="sum-two" /> };
export const SumSeven: StoryObj = { render: () => <Scene id="sum-seven" /> };
export const Pick: StoryObj = { render: () => <Scene id="pick" /> };
export const Chance: StoryObj = { render: () => <Scene id="chance" /> };
