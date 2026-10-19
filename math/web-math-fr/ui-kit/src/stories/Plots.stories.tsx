import type { Meta, StoryObj } from "@storybook/react-vite";
import { Caption, Figure, Panel, Plot } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Plots and captions",
  parameters: {
    docs: {
      description: {
        component:
          "The frame a canvas sits in and the line under it. `Plot` is the frame (the page gives it a height and draws inside); `Figure` holds a plot and its `Caption` in the order `config/plots.ts` sets (caption below or above). The plot's background, border and the line weights the pages read are in `config/plots.ts`; the caption's type is the `caption` style in `config/text.ts`. Explanations go in the caption, never drawn inside the plot.",
      },
    },
  },
};
export default meta;

function FakeCurve() {
  return (
    <svg viewBox="0 0 400 160" className="h-full w-full" aria-hidden="true">
      <g stroke="var(--c-border)" strokeWidth="1">
        {[40, 80, 120].map((y) => (
          <line key={y} x1="0" x2="400" y1={y} y2={y} />
        ))}
      </g>
      <path d="M0 150 C 80 140, 120 60, 200 50 S 320 20, 400 12" fill="none" stroke="var(--c-selected)" strokeWidth="2" />
      <path d="M0 155 C 100 150, 160 120, 240 110 S 360 90, 400 88" fill="none" stroke="var(--c-secondary)" strokeWidth="2" />
    </svg>
  );
}

export const WithCaption: StoryObj = {
  name: "With a caption",
  parameters: { docs: { description: { story: "A plot in a panel with its caption, as every play page shows its result." } } },
  render: () => (
    <Panel className="max-w-lg">
      <Figure>
        <Plot className="h-40">
          <FakeCurve />
        </Plot>
        <Caption>The loss over the steps: the quick setting in green reaches the floor in 96 sweeps, the slow one in blue is still falling.</Caption>
      </Figure>
    </Panel>
  ),
};

export const Bare: StoryObj = {
  parameters: { docs: { description: { story: "The frame on its own, outside a panel." } } },
  render: () => <Plot className="h-40 max-w-lg" />,
};
