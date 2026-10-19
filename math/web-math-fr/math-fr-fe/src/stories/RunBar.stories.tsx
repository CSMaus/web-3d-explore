import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading } from "@kit/index";
import { useState } from "react";
import { RunBar } from "@/components/RunBar";

const meta: Meta = { title: "Controls/RunBar" };
export default meta;

function Bar({ pace, limit: start }: { pace: "fast" | "slow"; limit: number }) {
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(start);
  const [speed, setSpeed] = useState(pace === "slow" ? 0.5 : 4);
  return (
    <div className="max-w-sm rounded border border-selected/40 p-4">
      <Heading level={2}>RUN</Heading>
      <div className="mt-3">
        <RunBar
          running={running}
          count={count}
          what="steps"
          limit={limit}
          onLimit={setLimit}
          limitRange={{ min: 100, max: 6000, step: 100 }}
          onToggle={() => setRunning((v) => !v)}
          onStep={(many) => setCount((c) => Math.min(limit, c + many))}
          onReset={() => {
            setRunning(false);
            setCount(0);
          }}
          perFrame={speed}
          onSpeed={setSpeed}
          pace={pace}
        />
      </div>
    </div>
  );
}

export const Fast: StoryObj = { render: () => <Bar pace="fast" limit={3000} /> };
export const Slow: StoryObj = { render: () => <Bar pace="slow" limit={400} /> };
