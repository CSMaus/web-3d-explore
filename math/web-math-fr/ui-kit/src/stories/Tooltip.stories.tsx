import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";

const meta: Meta = {
  title: "Elements/Tooltip",
  parameters: {
    docs: {
      description: {
        component: "A short note that appears over an element on hover or focus, from the registry. It follows the panel colour and the palette. Hover or tab to the button.",
      },
    },
  },
};
export default meta;

export const OnAButton: StoryObj = {
  name: "On a button",
  parameters: { docs: { description: { story: "A tooltip saying what the step button does." } } },
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Ten steps</Button>
        </TooltipTrigger>
        <TooltipContent>Moves every number ten times and stops.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
