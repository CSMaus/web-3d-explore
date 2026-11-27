import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { ReactNode } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Plot } from "@/components/Plot";
import { RunBar } from "@/components/RunBar";
import { Slider } from "@/components/Slider";
import { Story } from "@/components/Story";
import { TaskPage, ToLab, Verdict } from "@/components/TaskPage";
import { FAINT, ONE, ticks } from "@/lib/draw";
import { UNIT } from "@/lib/panes";

const meta: Meta = { title: "Pages/TaskPage" };
export default meta;

const STEPS = [
  { say: "How wrong starts high.", top: "Steps: 0", share: 0.02 },
  { say: "Each step takes a little of it away.", top: "Steps: 100", share: 0.25 },
  { say: "After many steps almost nothing is left.", top: null, share: 1 },
];
const POINTS = 200;

function fall(share: number): [number, number][] {
  const n = Math.max(1, Math.round(POINTS * share));
  return Array.from({ length: n + 1 }, (_, i) => [i / POINTS, 0.1 + 0.8 * Math.exp((-4 * i) / POINTS)]);
}

function Tale() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const current = STEPS[step];
  return (
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
          deps={[step]}
          draw={(pen) => {
            pen.axes(FAINT);
            pen.line(fall(current.share), ONE, 2);
          }}
        />
      }
      end={<ToLab />}
      playing={playing}
      onToggle={() => setPlaying((v) => !v)}
    />
  );
}

function Demo({ story }: { story?: ReactNode }) {
  const [rate, setRate] = useState(0.3);
  const [kind, setKind] = useState("rings");
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  return (
    <main className="mx-auto max-w-6xl">
      <TaskPage
        title="How it learns, and how fast"
        story={story}
        job="The same network on the same dots, with the learning itself as the thing to look at. Every step: measure how wrong, find which way is down for each number, move."
        input={
          <div className="space-y-3">
            <Choices
              options={[
                { id: "rings", label: "A ring inside a ring" },
                { id: "xor", label: "Exclusive or" },
              ]}
              value={kind}
              onPick={setKind}
            />
            <Slider
              label="Step size"
              min={0.01}
              max={3}
              step={0.01}
              value={rate}
              format={(v) => v.toFixed(2)}
              onChange={setRate}
            />
          </div>
        }
        run={
          <RunBar
            running={running}
            count={count}
            limit={4000}
            onToggle={() => setRunning((v) => !v)}
            onStep={(n) => setCount((c) => c + n)}
            onReset={() => setCount(0)}
            perFrame={4}
            onSpeed={() => undefined}
          />
        }
        picture={
          <div>
            <div data-slot="plot" className="h-[260px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: 400, y0: 0, y1: 0.3 }}
                deps={[count]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(
                    Array.from(
                      { length: Math.min(400, count + 1) },
                      (_, i) => [i, 0.28 * Math.exp(-i / 90)] as [number, number],
                    ),
                    ONE,
                    2,
                  );
                }}
              />
            </div>
            <Caption>How wrong, against steps</Caption>
          </div>
        }
        result={
          <div className="space-y-2">
            <Verdict good={count > 300 ? true : undefined}>
              {count === 0
                ? "Nothing learned yet. Press run."
                : `After ${count} steps, how wrong is ${(0.28 * Math.exp(-count / 90)).toFixed(4)}.`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
              <dt>Method</dt>
              <dd className="text-right text-foreground/80">Gradient descent</dd>
              <dt>Numbers being moved</dt>
              <dd className="text-right text-foreground/80">25</dd>
            </dl>
          </div>
        }
      />
    </main>
  );
}

export const WhatGoesInRunWhatCameOut: StoryObj = { render: () => <Demo /> };
export const WithStory: StoryObj = { render: () => <Demo story={<Tale />} /> };
