import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Slider } from "@/components/Slider";

const meta: Meta<typeof Slider> = {
  title: "Controls/Slider",
  component: Slider,
  args: {
    label: "Step size",
    min: 0.01,
    max: 3,
    step: 0.01,
    value: 0.3,
    format: (v: number) => v.toFixed(2),
  },
};
export default meta;

type Args = React.ComponentProps<typeof Slider>;

function LiveSlider(args: Args) {
  const [value, setValue] = useState(args.value);
  return (
    <div className="max-w-sm">
      <Slider {...args} value={value} onChange={setValue} />
    </div>
  );
}

function ThreeSliders() {
  const [a, setA] = useState(0.5);
  const [b, setB] = useState(12);
  const [c, setC] = useState(60);
  return (
    <div className="max-w-sm space-y-3">
      <Slider
        label="Step size"
        min={0.05}
        max={4}
        step={0.05}
        value={a}
        format={(v) => v.toFixed(2)}
        onChange={setA}
      />
      <Slider
        label="Units"
        min={2}
        max={40}
        step={1}
        value={b}
        format={(v) => `${v}`}
        onChange={setB}
      />
      <Slider
        label="Steepness"
        min={5}
        max={300}
        step={5}
        value={c}
        format={(v) => `${v}`}
        onChange={setC}
      />
    </div>
  );
}

export const Live: StoryObj<typeof Slider> = { render: (args) => <LiveSlider {...args} /> };
export const Several: StoryObj<typeof Slider> = { render: () => <ThreeSliders /> };
