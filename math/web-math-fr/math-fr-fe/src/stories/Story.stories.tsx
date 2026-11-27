import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@kit/index";
import { useState } from "react";
import { Plot } from "@/components/Plot";
import { Story } from "@/components/Story";
import { FAINT, ONE } from "@/lib/draw";
import { UNIT } from "@/lib/panes";

const meta: Meta = { title: "Pages/Story" };
export default meta;

const STEPS = [
  { say: "A wave made of one turn.", top: "Waves: 1", waves: 1 },
  { say: "A second, faster wave is added to it.", top: "Waves: 2", waves: 2 },
  { say: "With three the line starts to look square.", top: null, waves: 3 },
];
const POINTS = 200;

function curve(waves: number): [number, number][] {
  return Array.from({ length: POINTS + 1 }, (_, i) => {
    const x = i / POINTS;
    let y = 0;
    for (let k = 0; k < waves; k += 1) {
      const n = 2 * k + 1;
      y += Math.sin(2 * Math.PI * n * x) / n;
    }
    return [x, 0.5 + 0.3 * y];
  });
}

function Demo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [bold, setBold] = useState(false);
  const current = STEPS[step];
  return (
    <main className="mx-auto max-w-6xl">
      <Story
        count={STEPS.length}
        step={step}
        onStep={setStep}
        say={current.say}
        top={current.top}
        picture={
          <Plot
            className="h-full w-full"
            box={UNIT}
            deps={[step, bold]}
            draw={(pen) => {
              pen.axes(FAINT);
              pen.line(curve(current.waves), ONE, bold ? 4 : 2);
            }}
          />
        }
        act={
          step === 1 ? (
            <Button variant="outline" onClick={() => setBold((v) => !v)}>
              Change the line width
            </Button>
          ) : null
        }
        end={<Button variant="outline">Go to the experiment</Button>}
        playing={playing}
        onToggle={() => setPlaying((v) => !v)}
      />
    </main>
  );
}

export const ThreeSteps: StoryObj = { render: () => <Demo /> };
