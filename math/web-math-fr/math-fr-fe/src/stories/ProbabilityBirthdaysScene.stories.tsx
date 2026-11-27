import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { DEFAULTS, applyAct, build, draw } from "@/scenes/probability/birthdays";
import { STEPS } from "@/storylines/probability/birthdays";

const meta: Meta = { title: "Scenes/Probability/Birthdays" };
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
export const Few: StoryObj = { render: () => <Scene id="few" /> };
export const AnyPair: StoryObj = { render: () => <Scene id="any-pair" /> };
export const Two: StoryObj = { render: () => <Scene id="two" /> };
export const Three: StoryObj = { render: () => <Scene id="three" /> };
export const Four: StoryObj = { render: () => <Scene id="four" /> };
export const Web: StoryObj = { render: () => <Scene id="web" /> };
export const Slide: StoryObj = { render: () => <Scene id="slide" /> };
export const Flip: StoryObj = { render: () => <Scene id="flip" /> };
export const Half: StoryObj = { render: () => <Scene id="half" /> };
