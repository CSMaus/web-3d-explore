import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/poisson";
import { STEPS } from "@/storylines/probability/poisson";

const meta: Meta = { title: "Scenes/Probability/Poisson" };
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
export const Random: StoryObj = { render: () => <Scene id="random" /> };
export const Six: StoryObj = { render: () => <Scene id="six" /> };
export const Coin: StoryObj = { render: () => <Scene id="coin" /> };
export const Sixty: StoryObj = { render: () => <Scene id="sixty" /> };
export const SixHundred: StoryObj = { render: () => <Scene id="six-hundred" /> };
export const E: StoryObj = { render: () => <Scene id="e" /> };
export const Mean: StoryObj = { render: () => <Scene id="mean" /> };
export const Uses: StoryObj = { render: () => <Scene id="uses" /> };
