import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Field } from "../components/controls";
import { Label } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Sliders",
  parameters: {
    docs: {
      description: {
        component:
          "A named slider with its value read out: the step size, the number of units, the depth of a zoom on every play page. The track, thumb and where the value sits come from `config/sliders.ts`; the name is the `field` style and the number the `fieldValue` style in `config/text.ts`.",
      },
    },
  },
};
export default meta;

function Demo() {
  const [rate, setRate] = useState(0.3);
  const [units, setUnits] = useState(12);
  const [depth, setDepth] = useState(6);
  return (
    <div className="max-w-md space-y-3">
      <Field label="Step size" min={0.01} max={3} step={0.01} value={rate} format={(v) => v.toFixed(2)} onChange={setRate} />
      <Field label="Units" min={2} max={40} step={1} value={units} format={(v) => `${v}`} onChange={setUnits} />
      <Field label="Depth" min={1} max={12} step={1} value={depth} format={(v) => `${v}`} onChange={setDepth} />
    </div>
  );
}

export const WithValues: StoryObj = {
  name: "With their values",
  parameters: { docs: { description: { story: "Three sliders as a play page stacks them under its label." } } },
  render: () => (
    <div>
      <Label>What goes in</Label>
      <div className="mt-3">
        <Demo />
      </div>
    </div>
  ),
};
