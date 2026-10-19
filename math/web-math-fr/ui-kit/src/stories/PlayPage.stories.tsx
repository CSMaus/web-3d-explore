import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Choices, Field } from "../components/controls";
import { Caption, Figure, Heading, Page, Panel, Plot, Readout, Verdict } from "../components/pieces";
import { Button } from "../components/ui/button";

const meta: Meta = {
  title: "Pages/A play page",
  parameters: {
    docs: {
      description: {
        component:
          "The shape every play page has, built from the elements: a heading, then three panels: what goes in (choices and sliders), run (the buttons), what came out (the verdict, the numbers, the picture with its caption). Nothing here is styled by hand; a config change shows on the whole page at once.",
      },
    },
  },
};
export default meta;

function Demo() {
  const [data, setData] = useState("split");
  const [rate, setRate] = useState(0.3);
  const [units, setUnits] = useState(12);
  const [ran, setRan] = useState(false);
  return (
    <Page className="!pt-4">
      <Heading>A small change</Heading>
      <p className="mt-2 max-w-2xl">Push one weight a little and watch which dots change side. The page is a task: set what goes in, run, read what came out.</p>
      <div className="mt-8 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel label="What goes in">
            <div className="space-y-4">
              <Choices
                options={[
                  { id: "split", label: "Two clouds" },
                  { id: "xor", label: "Exclusive or" },
                  { id: "rings", label: "A ring inside a ring" },
                ]}
                value={data}
                onPick={setData}
              />
              <Field label="Step size" min={0.01} max={3} step={0.01} value={rate} format={(v) => v.toFixed(2)} onChange={setRate} />
              <Field label="Units" min={2} max={40} step={1} value={units} format={(v) => `${v}`} onChange={setUnits} />
            </div>
          </Panel>
          <Panel label="Run" tone="primary">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setRan(true)}>Run</Button>
              <Button variant="outline">One step</Button>
              <Button variant="outline" onClick={() => setRan(false)}>
                Reset
              </Button>
            </div>
          </Panel>
          <Panel label="What came out">
            <div className="space-y-3">
              {ran ? <Verdict good>Done: every dot right after 412 steps. How wrong: 0.0031.</Verdict> : <Verdict>Nothing has run yet. Press run.</Verdict>}
              <Readout rows={[["Dataset", data], ["Step size", rate.toFixed(2)], ["Units", String(units)]]} />
            </div>
          </Panel>
        </div>
        <Panel>
          <Figure>
            <Plot className="h-[420px]" />
            <Caption>The dots and the line between them; the line moves with each step.</Caption>
          </Figure>
        </Panel>
      </div>
    </Page>
  );
}

export const TaskShape: StoryObj = {
  name: "The task shape",
  parameters: { docs: { description: { story: "Live: pick a dataset, move the sliders, press run." } } },
  render: () => <Demo />,
};
