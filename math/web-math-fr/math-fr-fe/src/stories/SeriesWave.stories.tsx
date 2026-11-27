import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { useStoryClock } from "@/lib/storyClock";
import { stageOf } from "@/scenes/kit";
import { drawWave } from "@/scenes/series/wave";
import type { WaveState } from "@/scenes/series/wave";

const meta: Meta = { title: "Scenes/Series/Wave" };
export default meta;

const ONE_ARROW: WaveState = { wave: "square", shown: 1, proj: 0, strip: 0, ghost: 0 };
const THREE_ARROWS: WaveState = { wave: "square", shown: 3, proj: 1, strip: 1, ghost: 0 };
const SAWTOOTH_TWELVE: WaveState = { wave: "sawtooth", shown: 12, proj: 1, strip: 1, ghost: 1 };

function Scene({ state }: { state: WaveState }) {
  const host = useRef<HTMLDivElement | null>(null);
  const clock = useStoryClock(host);
  return (
    <div ref={host} data-slot="plot" className="h-[420px] w-[720px] max-w-full overflow-hidden">
      <Plot
        className="h-full w-full"
        box={UNIT}
        deps={[state, clock.time]}
        draw={(pen) => drawWave(pen, stageOf(pen), state, clock.time)}
      />
    </div>
  );
}

export const OneArrow: StoryObj = { render: () => <Scene state={ONE_ARROW} /> };
export const ThreeArrows: StoryObj = { render: () => <Scene state={THREE_ARROWS} /> };
export const SawtoothTwelve: StoryObj = { render: () => <Scene state={SAWTOOTH_TWELVE} /> };
