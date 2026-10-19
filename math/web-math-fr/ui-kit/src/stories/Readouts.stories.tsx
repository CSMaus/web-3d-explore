import type { Meta, StoryObj } from "@storybook/react-vite";
import { Panel, Readout, Verdict } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Verdicts and readouts",
  parameters: {
    docs: {
      description: {
        component:
          "What a play page says after a run. `Verdict` is one sentence, coloured by `good` (the accent when the run did its job, the warn colour when it blew up, plain when it has nothing to judge yet); its type is the `verdict` style. `Readout` is the list of names and numbers under it, laid out as pairs or as table rows by `config/text.ts`, in the `readout` and `readoutValue` styles.",
      },
    },
  },
};
export default meta;

export const Verdicts: StoryObj = {
  parameters: { docs: { description: { story: "The three kinds of verdict." } } },
  render: () => (
    <div className="max-w-md space-y-2">
      <Verdict good>Done: every dot right after 412 steps. How wrong: 0.0031.</Verdict>
      <Verdict good={false}>The run blew up after 23 steps.</Verdict>
      <Verdict>The dot (0, 1) is about to go in. Press run.</Verdict>
    </div>
  ),
};

export const Numbers: StoryObj = {
  parameters: { docs: { description: { story: "A readout of names and numbers in the panel that shows what came out." } } },
  render: () => (
    <Panel label="What came out" className="max-w-md">
      <div className="space-y-3">
        <Verdict good>Done: every dot right after 412 steps.</Verdict>
        <Readout rows={[["Method", "Gradient descent"], ["Numbers being moved", "25"], ["Runs kept", "3"], ["How wrong", "0.0031"]]} />
      </div>
    </Panel>
  ),
};
