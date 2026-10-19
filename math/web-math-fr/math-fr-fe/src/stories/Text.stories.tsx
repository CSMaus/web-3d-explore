import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "@kit/index";
import { Caption } from "@/components/Caption";
import { Readout } from "@/components/Readout";
import { Tex } from "@/components/Tex";
import { Verdict } from "@/components/TaskPage";

const meta: Meta = { title: "Text/Pieces" };
export default meta;

export const Verdicts: StoryObj = {
  render: () => (
    <div className="max-w-2xl space-y-3">
      <Verdict>
        The dot (0, 1) is about to go in. It wants green. Press run, or one step, and watch it pass
        through six moments.
      </Verdict>
      <Verdict good>
        Done: every dot right after 412 steps with gradient descent. How wrong: 0.0031.
      </Verdict>
      <Verdict good={false}>
        The run blew up after 23 steps: how wrong went up instead of down and kept going.
      </Verdict>
    </div>
  ),
};

export const ReadoutRows: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <Readout
        rows={[
          ["Box-counting dimension", "1.771"],
          ["Points drawn", "90,000"],
          ["Contraction factors", "0.160, 0.851, 0.341, 0.379"],
        ]}
      />
    </div>
  ),
};

export const Captions: StoryObj = {
  render: () => (
    <div className="max-w-md space-y-2">
      <div className="h-24 rounded border border-border" />
      <Caption>
        The plane, coloured by the unit's answer. White ring: wrong. Sky ring: the dot shown at
        right
      </Caption>
    </div>
  ),
};

export const Formulas: StoryObj = {
  render: () => (
    <div className="max-w-md space-y-2">
      <div data-text="label">
        One step on three numbers
      </div>
      <Tex tex={String.raw`w_i \leftarrow w_i - \eta\,\frac{\partial L}{\partial w_i}`} block />
      <div data-text="note">The hill page with three directions instead of two.</div>
      <Text kind="body" as="p">
        Inline, as in a sentence: the dimension is <Tex tex={String.raw`\log 4 / \log 3`} />, about
        1.26.
      </Text>
    </div>
  ),
};
