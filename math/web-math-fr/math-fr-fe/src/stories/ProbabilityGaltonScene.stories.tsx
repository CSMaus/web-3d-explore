import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { useStoryClock } from "@/lib/storyClock";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/galton";
import { STEPS } from "@/storylines/probability/galton";

const meta: Meta = { title: "Scenes/Probability/Galton" };
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
export const Pin: StoryObj = { render: () => <Scene id="pin" /> };
export const RowOne: StoryObj = { render: () => <Scene id="row-one" /> };
export const RowTwo: StoryObj = { render: () => <Scene id="row-two" /> };
export const RowThree: StoryObj = { render: () => <Scene id="row-three" /> };
export const RowFour: StoryObj = { render: () => <Scene id="row-four" /> };
export const Middle: StoryObj = { render: () => <Scene id="middle" /> };
export const Pascal: StoryObj = { render: () => <Scene id="pascal" /> };
export const Tilt: StoryObj = { render: () => <Scene id="tilt" /> };
