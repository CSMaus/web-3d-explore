import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Chips, Choices } from "../components/controls";
import { Label } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Choices and chips",
  parameters: {
    docs: {
      description: {
        component:
          "A group of options with one chosen, as every play page offers them (the dataset, the method, the colour of a plotted series). `Choices` takes named options; `Chips` takes plain strings with an optional colour each. Both are rows of real buttons with `aria-pressed`, never radios, so a page finds them by name. Their look is the plain button's three states in `config/buttons.ts`, laid out by `config/tabs.ts`.",
      },
    },
  },
};
export default meta;

const OPTIONS = [
  { id: "split", label: "Two clouds" },
  { id: "xor", label: "Exclusive or" },
  { id: "rings", label: "A ring inside a ring" },
  { id: "spiral", label: "Two spirals" },
];

function ChoicesDemo() {
  const [value, setValue] = useState("split");
  return <Choices options={OPTIONS} value={value} onPick={setValue} />;
}

function ChipsDemo() {
  const [chip, setChip] = useState("Leaf");
  const tints: Record<string, string> = { Leaf: "#7ff0d8", Sky: "#9b8cf5", Gold: "#e5c76b", Rose: "#f08fb7" };
  return <Chips items={Object.keys(tints)} active={chip} onPick={setChip} tint={(i) => tints[i]} />;
}

export const OneOfSeveral: StoryObj = {
  name: "One of several",
  parameters: { docs: { description: { story: "Named options; the group always has a value." } } },
  render: () => (
    <div>
      <Label>Dataset</Label>
      <div className="mt-3">
        <ChoicesDemo />
      </div>
    </div>
  ),
};

export const ChipsWithColours: StoryObj = {
  name: "Chips with a colour each",
  parameters: { docs: { description: { story: "Plain strings, each tinted: the palette chips under the Mandelbulb and the series pickers." } } },
  render: () => (
    <div>
      <Label>Colour</Label>
      <div className="mt-3">
        <ChipsDemo />
      </div>
    </div>
  ),
};
