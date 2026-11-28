import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { useStoryClock } from "@/lib/storyClock";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/ruin";
import { STEPS } from "@/storylines/probability/ruin";

const meta: Meta = { title: "Scenes/Probability/Ruin" };
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
        deps={[step, clock.time, clock.playing]}
        draw={(pen) => draw(pen, DATA, step.fade, set, clock.time, clock.playing)}
      />
    </div>
  );
}

export const Hook: StoryObj = { render: () => <Scene id="hook" /> };
export const Loses: StoryObj = { render: () => <Scene id="loses" /> };
export const Bet: StoryObj = { render: () => <Scene id="bet" /> };
export const Walls: StoryObj = { render: () => <Scene id="walls" /> };
export const Middle: StoryObj = { render: () => <Scene id="middle" /> };
export const Half: StoryObj = { render: () => <Scene id="half" /> };
export const Unfair: StoryObj = { render: () => <Scene id="unfair" /> };
export const Long: StoryObj = { render: () => <Scene id="long" /> };
export const Forty: StoryObj = { render: () => <Scene id="forty" /> };
export const Change: StoryObj = { render: () => <Scene id="change" /> };
export const Casino: StoryObj = { render: () => <Scene id="casino" /> };
