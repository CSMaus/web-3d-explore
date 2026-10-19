import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/ui/button";
import { Label } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Buttons",
  parameters: {
    docs: {
      description: {
        component:
          "Every button on the site, from `config/buttons.ts`. The default `<Button>` is the primary one (Run, Save version, Start with fractals, Donate); `variant=\"outline\"`, `\"secondary\"` and `\"ghost\"` are the plain button (One step, Reset, Log in). Each has three states written out in the config: at rest, under the pointer, pressed. Shape and padding are shared; the text is the `button` style in `config/text.ts`.",
      },
    },
  },
};
export default meta;

export const States: StoryObj = {
  parameters: { docs: { description: { story: "The three states of the primary and the plain button, held still with `data-look`, so a config change can be compared side by side." } } },
  render: () => (
    <div className="grid max-w-2xl gap-6 lg:grid-cols-3">
      {(["rest", "hover", "pressed"] as const).map((l) => (
        <div key={l}>
          <Label>{l}</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button data-look={l}>Primary</Button>
            <Button variant="outline" data-look={l}>Plain</Button>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Variants: StoryObj = {
  parameters: { docs: { description: { story: "Every variant the registry button has, live: hover and press them. Outline, secondary and ghost share the plain look; destructive takes the warn colour; link is text only." } } },
  render: () => (
    <div className="space-y-6">
      <div>
        <Label>The plain button</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline">One step</Button>
          <Button variant="outline">Ten steps</Button>
          <Button variant="outline">Reset</Button>
          <Button variant="outline" disabled>Disabled</Button>
          <Button variant="outline" aria-pressed="true">Pressed</Button>
        </div>
      </div>
      <div>
        <Label>The primary button</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button>Run</Button>
          <Button>Save version</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>
      <div>
        <Label>Others from the registry</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Stop</Button>
          <Button variant="link">A link</Button>
        </div>
      </div>
    </div>
  ),
};

export const RunBar: StoryObj = {
  name: "A run bar",
  parameters: { docs: { description: { story: "The row of buttons under every play page: one primary, the rest plain, as the site composes them." } } },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button>Run</Button>
      <Button variant="outline">One step</Button>
      <Button variant="outline">Ten steps</Button>
      <Button variant="outline">Reset</Button>
      <span className="ml-2 font-mono text-[12px] text-muted-foreground">step 412</span>
    </div>
  ),
};
