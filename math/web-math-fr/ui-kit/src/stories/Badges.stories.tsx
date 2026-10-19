import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Badges",
  parameters: {
    docs: {
      description: {
        component:
          "A small word on a card: the state of a topic on the topics index (Ready, Being written), the count on a tab. From the registry; it follows the palette and the panel corner.",
      },
    },
  },
};
export default meta;

export const Variants: StoryObj = {
  parameters: { docs: { description: { story: "Every variant the registry badge has." } } },
  render: () => (
    <div>
      <Label>Badges</Label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>Ready</Badge>
        <Badge variant="secondary">Six pages</Badge>
        <Badge variant="outline">Being written</Badge>
        <Badge variant="destructive">Blew up</Badge>
      </div>
    </div>
  ),
};
