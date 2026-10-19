import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label as FormLabel } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Toggle } from "../components/ui/toggle";
import { Label } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Inputs",
  parameters: {
    docs: {
      description: {
        component:
          "Text fields, switches and toggles from the registry. The input is the search field once opened and the name of a saved parameter set; its style, height and border are `config/inputs.ts`. The switch and the toggle follow the palette and the button shape.",
      },
    },
  },
};
export default meta;

function InputDemo() {
  const [name, setName] = useState("warm-paper");
  return (
    <div className="max-w-sm space-y-2">
      <FormLabel htmlFor="set-name">Name of the parameter set</FormLabel>
      <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} spellCheck={false} />
      <Input placeholder="Search the site" aria-label="Search" />
      <Input value="A disabled field" disabled readOnly aria-label="Disabled" />
    </div>
  );
}

function SwitchDemo() {
  const [on, setOn] = useState(true);
  const [pressed, setPressed] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <Switch checked={on} onCheckedChange={setOn} aria-label="Sections rise in" /> Sections rise in
      </div>
      <div className="flex items-center gap-3 text-sm">
        <Toggle pressed={pressed} onPressedChange={setPressed} variant="outline">
          Show the grid
        </Toggle>
        <span className="font-mono text-[11px] text-muted-foreground">{pressed ? "on" : "off"}</span>
      </div>
    </div>
  );
}

export const TextFields: StoryObj = {
  name: "Text fields",
  parameters: { docs: { description: { story: "A labelled field, a field with a placeholder, and a disabled one." } } },
  render: () => (
    <div>
      <Label>Inputs</Label>
      <div className="mt-3">
        <InputDemo />
      </div>
    </div>
  ),
};

export const SwitchesAndToggles: StoryObj = {
  name: "Switches and toggles",
  parameters: { docs: { description: { story: "An on/off switch with its sentence, and a toggle button that holds its state." } } },
  render: () => (
    <div>
      <Label>Switches</Label>
      <div className="mt-3">
        <SwitchDemo />
      </div>
    </div>
  ),
};
