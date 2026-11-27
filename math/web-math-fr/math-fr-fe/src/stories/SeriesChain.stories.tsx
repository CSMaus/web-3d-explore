import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { Plot } from "@/components/Plot";
import { UNIT } from "@/lib/panes";
import { useStoryClock } from "@/lib/storyClock";
import { stageOf } from "@/scenes/kit";
import { catOutline } from "@/scenes/series/cat";
import { drawChain } from "@/scenes/series/chain";
import type { ChainState } from "@/scenes/series/chain";
import { circlesOf, splitHub } from "@/systems/series";

const meta: Meta = { title: "Scenes/Series/Chain" };
export default meta;

const CAT = catOutline();
const { hub: HUB, arms: ARMS } = splitHub(circlesOf(CAT));

const CAT_FIVE: ChainState = { hub: HUB, arms: ARMS, shown: 5, target: 1, path: CAT };
const CAT_SIXTY: ChainState = { hub: HUB, arms: ARMS, shown: 60, target: 0, path: null };

function Scene({ state }: { state: ChainState }) {
  const host = useRef<HTMLDivElement | null>(null);
  const clock = useStoryClock(host);
  return (
    <div ref={host} data-slot="plot" className="h-[420px] w-[720px] max-w-full overflow-hidden">
      <Plot
        className="h-full w-full"
        box={UNIT}
        deps={[state, clock.time]}
        draw={(pen) => drawChain(pen, stageOf(pen), state, clock.time)}
      />
    </div>
  );
}

export const CatFive: StoryObj = { render: () => <Scene state={CAT_FIVE} /> };
export const CatSixty: StoryObj = { render: () => <Scene state={CAT_SIXTY} /> };
