import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { useStoryClock } from "@/lib/storyClock";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/doors";
import { STEPS } from "@/storylines/probability/doors";

const meta: Meta = { title: "Scenes/Probability/Doors" };
export default meta;

const DATA = build(DEFAULTS);

function Scene({ id }: { id: string }) {
  const host = useRef<HTMLDivElement | null>(null);
  const clock = useStoryClock(host);
  const step = STEPS.find((s) => s.id === id) ?? STEPS[0];
  const set = applyAct(step.set);
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
export const Pick: StoryObj = { render: () => <Scene id="pick" /> };
export const Host: StoryObj = { render: () => <Scene id="host" /> };
export const Even: StoryObj = { render: () => <Scene id="even" /> };
export const Play: StoryObj = { render: () => <Scene id="play" /> };
export const Hundred: StoryObj = { render: () => <Scene id="hundred" /> };
export const AllBut: StoryObj = { render: () => <Scene id="all-but" /> };
export const Skipped: StoryObj = { render: () => <Scene id="skipped" /> };
export const Why: StoryObj = { render: () => <Scene id="why" /> };
export const ThreeAgain: StoryObj = { render: () => <Scene id="three-again" /> };
