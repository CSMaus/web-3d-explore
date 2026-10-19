import type { Meta, StoryObj } from "@storybook/react-vite";
import { Hero, Panel, PanelHead, Plot, Tag } from "../components/pieces";
import { Button } from "../components/ui/button";

const meta: Meta = {
  title: "Elements/Hero",
  parameters: {
    docs: {
      description: {
        component:
          "The first screen of the front page: an eyebrow label, the display line, the lede, the actions, the tags at the left, and one picture at the right (the rotating Mandelbulb in its card on the site). It composes `Label`, `Display`, `Lede`, `Tag`, the buttons and a `Panel`, so every part of it is set by the config of those.",
      },
    },
  },
};
export default meta;

export const FrontPage: StoryObj = {
  name: "As on the front page",
  parameters: { docs: { description: { story: "The hero with a plain frame where the Mandelbulb draws itself." } } },
  render: () => (
    <Hero
      eyebrow="Mathematics, made visible"
      title={
        <>
          See the idea.
          <br />
          Then understand the math.
        </>
      }
      lede="Explore difficult, beautiful ideas through interactive experiments, visual stories, and notes that keep only what matters."
      actions={
        <>
          <Button>Start with fractals</Button>
          <Button variant="outline">Browse all topics</Button>
        </>
      }
      tags={
        <>
          <Tag>No prerequisites</Tag>
          <Tag colour="#9b8cf5">Learn at your pace</Tag>
          <Tag colour="#e5c76b">Free to explore</Tag>
        </>
      }
      picture={
        <Panel>
          <PanelHead meta="rotating">Mandelbulb</PanelHead>
          <Plot className="h-[420px]" />
        </Panel>
      }
    />
  ),
};
