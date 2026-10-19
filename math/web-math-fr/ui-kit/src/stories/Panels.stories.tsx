import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label, Panel, PanelHead, Plot } from "../components/pieces";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

const meta: Meta = {
  title: "Elements/Panels",
  parameters: {
    docs: {
      description: {
        component:
          "The boxes a page is built from, from `config/panels.ts`: style (bordered, flat, raised, inset, rules), padding, corner, border, and where the label sits. `Panel` takes an optional label (WHAT GOES IN, RUN, WHAT CAME OUT) and a tone; `PanelHead` is the title row of a card with a dot and a right-hand note (the Mandelbulb card on the front page). The registry `Card` follows the same rules.",
      },
    },
  },
};
export default meta;

export const Labelled: StoryObj = {
  parameters: { docs: { description: { story: "The three panels of a play page: a plain one, the run panel in the accent tone, and a muted one." } } },
  render: () => (
    <div className="grid max-w-4xl gap-4 lg:grid-cols-3">
      <Panel label="What goes in">
        <p className="text-sm">The controls of a page sit here, under a label the theme styles.</p>
      </Panel>
      <Panel label="Run" tone="primary">
        <div className="flex gap-2">
          <Button>Run</Button>
          <Button variant="outline">Reset</Button>
        </div>
      </Panel>
      <Panel label="What came out" tone="muted">
        <p className="text-sm">The verdict and the numbers after a run.</p>
      </Panel>
    </div>
  ),
};

export const WithHead: StoryObj = {
  name: "With a head",
  parameters: { docs: { description: { story: "A card with a title row: the dot, the title, a note at the right, and a picture frame below." } } },
  render: () => (
    <Panel className="max-w-md">
      <PanelHead meta="z² + c · 380 iter.">Mandelbrot explorer</PanelHead>
      <Plot className="h-48" />
    </Panel>
  ),
};

export const RegistryCard: StoryObj = {
  name: "The registry card",
  parameters: { docs: { description: { story: "shadcn's `Card`, with header, content and footer, under the same panel rules; and a `Separator`." } } },
  render: () => (
    <div className="max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fractals</CardTitle>
          <CardDescription>Sixty-nine clips, about twenty minutes; pages and applications built.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-sm">A topic card as the topics index shows it.</CardContent>
        <CardFooter className="pt-4">
          <Button variant="outline">Open the topic</Button>
        </CardFooter>
      </Card>
      <div>
        <Label>A separator</Label>
        <Separator className="mt-3" />
      </div>
    </div>
  ),
};
