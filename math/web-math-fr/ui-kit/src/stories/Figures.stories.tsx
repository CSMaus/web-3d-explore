import type { Meta, StoryObj } from "@storybook/react-vite";
import { EdgeFigure } from "../components/figures";
import { FIGURE_KINDS, FIGURE_NAMES } from "../lib/figures";
import { IconCard } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Figures",
  parameters: {
    docs: {
      description: {
        component:
          "A fractal drawn as thin edges with a light running along them, from `config/<case>/figures.ts`: the edge's width and colour, whether it is cut as relief, the light's colour, length, speed and halo, and whether it breathes. The figures are the ones the fractals topic draws: the Koch snowflake and curve, the Sierpinski triangle, arrowhead and carpet, the Vicsek cross, the Cantor set, the dragon, Lévy and Hilbert curves, the Gosper flowsnake and a binary tree. The `IconCard` puts one above a title and a text.",
      },
    },
  },
};
export default meta;

export const Four: StoryObj = {
  name: "Every figure",
  parameters: { docs: { description: { story: "Every figure at the same size, the light running." } } },
  render: () => (
    <div className="grid max-w-5xl grid-cols-2 gap-8 lg:grid-cols-4">
      {FIGURE_KINDS.map((k) => (
        <div key={k} className="space-y-2">
          <div className="aspect-square p-4">
            <EdgeFigure kind={k} />
          </div>
          <div className="text-center font-mono text-[11px] text-muted-foreground">{FIGURE_NAMES[k]}</div>
        </div>
      ))}
    </div>
  ),
};

export const InCards: StoryObj = {
  name: "In cards",
  parameters: { docs: { description: { story: "Three icon cards in a row, as a services screen shows them." } } },
  render: () => (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-3">
      <IconCard figure={<EdgeFigure kind="snowflake" />} title="Workflow optimisation">
        Automate the work by connecting the applications already in use, so the routine runs itself.
      </IconCard>
      <IconCard figure={<EdgeFigure kind="triangle" />} title="Business consulting">
        A look at how an organisation works and where a model would change it, before anything is built.
      </IconCard>
      <IconCard figure={<EdgeFigure kind="squares" />} title="Chatbot development">
        Assistants that hold a conversation, understand nuance and answer complicated questions.
      </IconCard>
    </div>
  ),
};
