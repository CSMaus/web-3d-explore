import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const meta: Meta = {
  title: "Elements/Tabs",
  parameters: {
    docs: {
      description: {
        component:
          "The tabs of a topic page (Parts, Play, Mathematics, Applications) and the sub-tabs of the applications section, from the registry. Their style is `config/tabs.ts` (chips, segmented, underline or links) and their colours in each state are the plain button in `config/buttons.ts`; the active tab takes the pressed look.",
      },
    },
  },
};
export default meta;

export const WithContent: StoryObj = {
  name: "With content",
  parameters: { docs: { description: { story: "Four tabs and the panel each one shows." } } },
  render: () => (
    <Tabs defaultValue="parts" className="max-w-xl">
      <TabsList>
        <TabsTrigger value="parts">Parts</TabsTrigger>
        <TabsTrigger value="play">Play</TabsTrigger>
        <TabsTrigger value="maths">Mathematics</TabsTrigger>
        <TabsTrigger value="uses">Applications</TabsTrigger>
      </TabsList>
      <TabsContent value="parts" className="pt-3 text-sm">The series, in order.</TabsContent>
      <TabsContent value="play" className="pt-3 text-sm">Every page that moves.</TabsContent>
      <TabsContent value="maths" className="pt-3 text-sm">The equations.</TabsContent>
      <TabsContent value="uses" className="pt-3 text-sm">Where it is used.</TabsContent>
    </Tabs>
  ),
};
