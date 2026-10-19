import type { Meta, StoryObj } from "@storybook/react-vite";
import { SkipLink, Strip, TextLink } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Links, strip and skip link",
  parameters: {
    docs: {
      description: {
        component:
          "`TextLink` is a link in running text, underlined or coloured by `config/motion.ts`. `Strip` is the thin line across the foot of the front page (observation, what is new, the scroll hint), in the `strip` style. `SkipLink` is the first thing a keyboard reaches: hidden above the page until it is focused, then it jumps past the top bar to the content; its type is the `skip` style, the one with a background.",
      },
    },
  },
};
export default meta;

export const InText: StoryObj = {
  name: "A link in text",
  parameters: { docs: { description: { story: "A sentence with a link in it." } } },
  render: () => (
    <p className="max-w-xl">
      The box-counting dimension is measured on the page about <TextLink href="#">the coastline paradox</TextLink>, and proved on the one after it.
    </p>
  ),
};

export const TheStrip: StoryObj = {
  name: "The strip",
  parameters: { docs: { description: { story: "The foot of the front page." } } },
  render: () => (
    <Strip>
      <span>Observation 01 / Fractals</span>
      <span>New: why the Mandelbrot set never repeats</span>
      <span>Scroll to discover ↓</span>
    </Strip>
  ),
};

export const Skip: StoryObj = {
  name: "The skip link",
  parameters: { docs: { description: { story: "Shown here held in place; on the site it appears only when focused. Press Tab in the canvas to see it move." } } },
  render: () => (
    <div className="relative h-24">
      <SkipLink style={{ position: "static" }}>Skip to content</SkipLink>
    </div>
  ),
};
