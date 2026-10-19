import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Chips } from "@/components/Chips";
import { Choices } from "@/components/Choices";

const meta: Meta = { title: "Controls/Choices" };
export default meta;

const OPTIONS = [
  { id: "split", label: "Two clouds" },
  { id: "xor", label: "Exclusive or" },
  { id: "rings", label: "A ring inside a ring" },
  { id: "spiral", label: "Two spirals" },
];

function FourChoices() {
  const [value, setValue] = useState("split");
  return <Choices options={OPTIONS} value={value} onPick={setValue} />;
}

function TintedChips() {
  const [active, setActive] = useState("Leaf");
  const tints: Record<string, string> = {
    Leaf: "#a5e3a0",
    Sky: "#8fd3e8",
    Violet: "#b49be8",
    Rose: "#c75ab0",
  };
  return (
    <Chips
      items={Object.keys(tints)}
      active={active}
      onPick={setActive}
      tint={(item) => tints[item]}
    />
  );
}

export const OneOfFour: StoryObj = { render: () => <FourChoices /> };
export const ChipsWithTints: StoryObj = { render: () => <TintedChips /> };
