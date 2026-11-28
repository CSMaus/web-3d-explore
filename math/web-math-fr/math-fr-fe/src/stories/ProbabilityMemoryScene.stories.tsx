import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/memory";
import { STEPS } from "@/storylines/probability/memory";

const meta: Meta = { title: "Scenes/Probability/Memory" };
export default meta;

const DATA = build(DEFAULTS);

function Scene({ id }: { id: string }) {
  const step = STEPS.find((s) => s.id === id) ?? STEPS[0];
  const set = applyAct(step.set, DEFAULTS, step.act);
  return (
    <div data-slot="plot" className="h-[420px] w-[720px] max-w-full overflow-hidden">
      <Plot
        className="h-full w-full"
        box={UNIT}
        deps={[step]}
        draw={(pen) => draw(pen, DATA, step.fade, set)}
      />
    </div>
  );
}

export const Hook: StoryObj = { render: () => <Scene id="hook" /> };
export const Bus: StoryObj = { render: () => <Scene id="bus" /> };
export const BusLeft: StoryObj = { render: () => <Scene id="bus-left" /> };
export const Taxi: StoryObj = { render: () => <Scene id="taxi" /> };
export const Take: StoryObj = { render: () => <Scene id="take" /> };
export const Same: StoryObj = { render: () => <Scene id="same" /> };
export const Name: StoryObj = { render: () => <Scene id="name" /> };
export const Change: StoryObj = { render: () => <Scene id="change" /> };
