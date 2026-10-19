import type { Meta, StoryObj } from "@storybook/react-vite";
import { Display, Label, Lede, Tag } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Display, lede, tags and labels",
  parameters: {
    docs: {
      description: {
        component:
          "The large words of a front page and the small ones of a panel. `Display` is the one very large line; `Lede` the paragraph under it; `Tag` a coloured word or two (NO PREREQUISITES); `Label` the small section label on a panel, rendered as a heading so a page's sections read in order, with the mark from `config/type.ts`. Each is a style in `config/text.ts` (`display`, `lede`, `tag`, `label`).",
      },
    },
  },
};
export default meta;

export const DisplayAndLede: StoryObj = {
  name: "Display and lede",
  parameters: { docs: { description: { story: "The top of the front page without its picture." } } },
  render: () => (
    <div className="max-w-2xl space-y-6">
      <Label as="div">Mathematics, made visible</Label>
      <Display>
        See the idea.
        <br />
        Then understand the math.
      </Display>
      <Lede>Difficult, beautiful ideas through interactive experiments, visual stories, and notes that keep only what matters.</Lede>
    </div>
  ),
};

export const Tags: StoryObj = {
  parameters: { docs: { description: { story: "Tags in the accent and in given colours." } } },
  render: () => (
    <div className="flex flex-wrap gap-6">
      <Tag>No prerequisites</Tag>
      <Tag colour="#9b8cf5">Learn at your pace</Tag>
      <Tag colour="#e5c76b">Free to explore</Tag>
    </div>
  ),
};

export const Labels: StoryObj = {
  parameters: { docs: { description: { story: "The section labels of a play page, as headings." } } },
  render: () => (
    <div className="space-y-3">
      <Label>What goes in</Label>
      <Label>Run</Label>
      <Label>What came out</Label>
      <Label as="h3">Mathematics</Label>
    </div>
  ),
};
