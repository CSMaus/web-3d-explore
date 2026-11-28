import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/test";
import { STEPS } from "@/storylines/probability/test";

const meta: Meta = { title: "Scenes/Probability/Test" };
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
export const Count: StoryObj = { render: () => <Scene id="count" /> };
export const Field: StoryObj = { render: () => <Scene id="field" /> };
export const Ill: StoryObj = { render: () => <Scene id="ill" /> };
export const Found: StoryObj = { render: () => <Scene id="found" /> };
export const Rare: StoryObj = { render: () => <Scene id="rare" /> };
export const Many: StoryObj = { render: () => <Scene id="many" /> };
export const Gather: StoryObj = { render: () => <Scene id="gather" /> };
export const Share: StoryObj = { render: () => <Scene id="share" /> };
export const Common: StoryObj = { render: () => <Scene id="common" /> };
export const Bayes: StoryObj = { render: () => <Scene id="bayes" /> };
