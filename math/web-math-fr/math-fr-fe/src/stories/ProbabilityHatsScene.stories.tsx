import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/hats";
import { STEPS } from "@/storylines/probability/hats";

const meta: Meta = { title: "Scenes/Probability/Hats" };
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
export const Average: StoryObj = { render: () => <Scene id="average" /> };
export const Three: StoryObj = { render: () => <Scene id="three" /> };
export const Count: StoryObj = { render: () => <Scene id="count" /> };
export const SixSix: StoryObj = { render: () => <Scene id="six-six" /> };
export const Why: StoryObj = { render: () => <Scene id="why" /> };
export const Hundredth: StoryObj = { render: () => <Scene id="hundredth" /> };
export const Add: StoryObj = { render: () => <Scene id="add" /> };
export const Linked: StoryObj = { render: () => <Scene id="linked" /> };
export const Shuffle: StoryObj = { render: () => <Scene id="shuffle" /> };
