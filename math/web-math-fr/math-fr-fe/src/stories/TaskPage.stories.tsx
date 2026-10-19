import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Plot } from "@/components/Plot";
import { RunBar } from "@/components/RunBar";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { FAINT, ONE, ticks } from "@/lib/draw";

const meta: Meta = { title: "Pages/TaskPage" };
export default meta;

function Demo() {
  const [rate, setRate] = useState(0.3);
  const [kind, setKind] = useState("rings");
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  return (
    <main className="mx-auto max-w-6xl">
      <TaskPage
        title="How it learns, and how fast"
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
