import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/game";
import { STEPS } from "@/storylines/probability/game";

const meta: Meta = { title: "Scenes/Probability/Game" };
export default meta;

const DATA = build(DEFAULTS);

function Scene({ id }: { id: string }) {
  const step = STEPS.find((s) => s.id === id) ?? STEPS[0];
  const set = applyAct(step.set);
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
export const Six: StoryObj = { render: () => <Scene id="six" /> };
export const Paid: StoryObj = { render: () => <Scene id="paid" /> };
export const Won: StoryObj = { render: () => <Scene id="won" /> };
export const Third: StoryObj = { render: () => <Scene id="third" /> };
export const Name: StoryObj = { render: () => <Scene id="name" /> };
export const Twenty: StoryObj = { render: () => <Scene id="twenty" /> };
export const Thousand: StoryObj = { render: () => <Scene id="thousand" /> };
export const Pull: StoryObj = { render: () => <Scene id="pull" /> };
export const Long: StoryObj = { render: () => <Scene id="long" /> };
