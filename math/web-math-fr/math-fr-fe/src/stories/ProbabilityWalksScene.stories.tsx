import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/walks";
import { STEPS } from "@/storylines/probability/walks";

const meta: Meta = { title: "Scenes/Probability/Walks" };
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
export const Step: StoryObj = { render: () => <Scene id="step" /> };
export const Ten: StoryObj = { render: () => <Scene id="ten" /> };
export const Fifty: StoryObj = { render: () => <Scene id="fifty" /> };
export const Root: StoryObj = { render: () => <Scene id="root" /> };
export const Cross: StoryObj = { render: () => <Scene id="cross" /> };
export const Stay: StoryObj = { render: () => <Scene id="stay" /> };
export const Hist: StoryObj = { render: () => <Scene id="hist" /> };
export const Again: StoryObj = { render: () => <Scene id="again" /> };
