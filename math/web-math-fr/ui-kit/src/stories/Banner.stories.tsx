import type { Meta, StoryObj } from "@storybook/react-vite";
import { Banner } from "../components/pieces";
import { Button } from "../components/ui/button";

const meta: Meta = {
  title: "Elements/Banner",
  parameters: {
    docs: {
      description: {
        component:
          "The consent notice at the foot of the screen: a bar across the width or a card in the corner, by `config/motion.ts`. Its text is the `banner` style. Shown here held in the flow; on the site it is fixed to the viewport.",
      },
    },
  },
};
export default meta;

export const Consent: StoryObj = {
  parameters: { docs: { description: { story: "The notice with its two buttons." } } },
  render: () => (
    <Banner className="!static max-w-3xl">
      <div className="flex flex-wrap items-center gap-4">
        <p className="flex-1 text-xs">This site keeps one cookie to hold a signed-in session, and records the network address of each request with the page it asked for. Addresses are kept for a limited period and then removed.</p>
        <Button>Accept</Button>
        <Button variant="ghost">Decline</Button>
      </div>
    </Banner>
  ),
};
