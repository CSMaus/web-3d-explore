import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/bins";
import { STEPS } from "@/storylines/probability/bins";

const meta: Meta = { title: "Scenes/Probability/Bins" };
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
export const Marks: StoryObj = { render: () => <Scene id="marks" /> };
export const Five: StoryObj = { render: () => <Scene id="five" /> };
export const Narrower: StoryObj = { render: () => <Scene id="narrower" /> };
export const Curve: StoryObj = { render: () => <Scene id="curve" /> };
export const Area: StoryObj = { render: () => <Scene id="area" /> };
export const Move: StoryObj = { render: () => <Scene id="move" /> };
export const Seventh: StoryObj = { render: () => <Scene id="seventh" /> };
