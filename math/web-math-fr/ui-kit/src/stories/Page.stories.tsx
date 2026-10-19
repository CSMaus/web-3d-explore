import type { Meta, StoryObj } from "@storybook/react-vite";
import { theme } from "../../config/index.ts";
import { Heading, Page } from "../components/pieces";

const meta: Meta = {
  title: "Foundations/Page",
  parameters: {
    docs: {
      description: {
        component:
          "The page as a whole, from `config/page.ts`: the reading width, the side gutters, the density multiplier on every gap and padding, and what is painted behind the page (plain, gradient, grain, grid, vignette). The `Page` element is the `<main>` of every route; it never grows wider than the configured width.",
      },
    },
  },
};
export default meta;

export const Width: StoryObj = {
  parameters: { docs: { description: { story: "The reading width and gutters drawn as a frame around the content area." } } },
  render: () => (
    <Page className="!pt-4 !pb-4">
      <div className="rounded-lg border border-dashed border-border p-6">
        <Heading>The content area</Heading>
        <p className="mt-2 text-sm">
          Width {theme.page.width}px, gutters {theme.page.gutter}px, density {theme.page.density}, background "{theme.page.background}". Resize the window: the gutters hold on narrow screens and the width caps on wide ones.
        </p>
      </div>
    </Page>
  ),
};
