import { createFileRoute } from "@tanstack/react-router";
import { Swatch, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Equations } from "@/components/Equations";
import { OptionGroup } from "@/components/OptionGroup";
import { Plot } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { StoryOf } from "@/components/StoryOf";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, dot, frame, line, pane } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import * as scene from "@/scenes/probability/birthdays";
import type { Values } from "@/scenes/probability/birthdays";
import { STEPS } from "@/storylines/probability/birthdays";
import type { Act } from "@/storylines/probability/birthdays";
import { choose, evenAt, rngFrom, roomShares, shared } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/birthdays")({
  loader: () => api.system(TOPIC, "birthdays"),
  component: BirthdaysPage,
});

const MOST = 70;
const ROOMS = 500;
const ROOM_LEAST = 2;
const ROOM_MOST = 60;

function storyAct(act: Act, values: Values, change: (next: Values) => void) {
  switch (act) {
    case "people":
      return (
        <div className="max-w-2xl">
          <Slider label={L("Number of people")} min={ROOM_LEAST} max={ROOM_MOST} step={1} value={values.people} format={(v) => String(Math.round(v))} onChange={(v) => change({ people: Math.round(v) })} />
        </div>
      );
  }
}

/**
 * people added to a room one at a time. the exact chance that two of them share a birthday is drawn
 * as the run goes, with the share of 500 rooms of random birthdays beside it, and the reader's guess
 * as a dashed line placed before the run.
 */
function BirthdaysPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [guess, setGuess] = useState(40);
  const [perFrame, setPerFrame] = useState(0.25);
  const [n, setN] = useState(0);
  const runner = useRunner((k) => setN(Math.min(MOST, k)), { perFrame, stopAt: MOST });
  const rooms = useMemo(() => {
    const rng = rngFrom(23);
    return Array.from({ length: MOST + 1 }, (_, people) => {
      let yes = 0;
      for (let r = 0; r < ROOMS; r += 1) if (roomShares(people, rng)) yes += 1;
      return yes / ROOMS;
    });
  }, []);
  const even = evenAt();
  const p = shared(n);
  const reset = () => {
    runner.reset();
    setN(0);
  };

  return (
    <TaskPage
      title={system?.name ?? L("Shared birthdays")}
      job={L("How many people does a room need for a likely shared birthday?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("A guess first")} note={L("Set the number of people at which the chance of a shared birthday reaches one half. The guess stays on the picture as a dashed upright line, so the curve can be compared with it.")}>
            <Slider label={L("Guess: people needed for a chance of one half")} min={2} max={MOST} step={1} value={guess} format={(v) => String(Math.round(v))} onChange={(v) => setGuess(Math.round(v))} />
          </OptionGroup>
          <Text kind="note" as="p">
            {L("One step adds one person to the room. For each number of people, the computer also fills 500 rooms with random birthdays and counts the rooms where two people share a birthday. Those shares are the dots.")}
          </Text>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={n}
          limit={MOST}
          what={L("people")}
          onToggle={() => {
            if (!runner.running && n >= MOST) reset();
            runner.toggle();
          }}
          onStep={(many) => runner.once(many)}
          onReset={reset}
          perFrame={perFrame}
          onSpeed={setPerFrame}
          pace="slow"
        />
      }
      picture={
        <section ref={stage}>
          <Text kind="note" as="div" className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
            <span><Swatch colour={ONE} />{L("Line: the exact chance")}</span>
            <span><Swatch colour={SKY} />{L("Share of 500 random rooms with a shared birthday")}</span>
            <span><Swatch colour={TWO} />{L("Dashed line: the guess")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[n, guess, rooms]}
              draw={(pen) => {
                const g = pane(pen, { x0: 0, x1: 1, y0: 0, y1: 1 }, { x0: 0, x1: MOST, y0: 0, y1: 1 });
                frame(pen, g, { x: 10, y: 0.25 });
                line(pen, g, [[0, 0.5], [MOST, 0.5]], MUTED, 1);
                pen.ctx.setLineDash([5, 4]);
                line(pen, g, [[guess, 0], [guess, 1]], TWO, 1.6);
                pen.ctx.setLineDash([]);
                const pts: [number, number][] = [];
                for (let k = 1; k <= n; k += 1) pts.push([k, shared(k)]);
                line(pen, g, pts, ONE, 2.4);
                for (let k = 2; k <= n; k += 1) dot(pen, g, k, rooms[k], 2.2, SKY);
                if (n > 0) dot(pen, g, n, p, 5, ONE);
                if (n >= even) dot(pen, g, even, shared(even), 4, TWO);
              }}
            />
          </div>
          <Caption>
            {L("Across: the number of people in the room, from 0 to 70. Up: the chance that at least two of them share a birthday, from 0 to 1. The flat line marks one half. The thick line is the exact chance, the dots are the shares of 500 random rooms, and the dashed upright line is the guess.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={n >= even ? Math.abs(guess - even) <= 3 : undefined}>
            {n === 0
              ? L("The guess is {{g}} people. Press run to add people one at a time. The curve starts at zero.", { g: guess })
              : n < even
                ? L("With {{n}} people in the room, the chance of a shared birthday is {{p}} per cent. The room holds {{pairs}} pairs of people, and any one pair could share a birthday.", { n, p: (p * 100).toFixed(1), pairs: choose(n, 2) })
                : L("The chance of a shared birthday passes one half at {{e}} people: {{pe}} per cent, with {{pairs}} pairs in the room. The guess was {{g}}. With {{n}} people the chance is {{p}} per cent.", { e: even, pe: (shared(even) * 100).toFixed(1), pairs: choose(even, 2), g: guess, n, p: (p * 100).toFixed(1) })}
          </Verdict>
          <Readout
            rows={[
              [L("People in the room"), String(n)],
              [L("Pairs of people in the room"), String(choose(n, 2))],
              [L("Exact chance of a shared birthday"), p.toFixed(4)],
              [L("Share of 500 random rooms with a shared birthday"), n >= 2 ? rooms[n].toFixed(3) : "-"],
              [L("Fewest people for a chance over one half, and that chance"), `${even}, ${shared(even).toFixed(4)}`],
              [L("Guess: people needed for a chance of one half"), String(guess)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The guess goes wrong because it thinks of one person's birthday. A shared birthday needs any one pair of people to match, and the number of pairs grows much faster than the number of people: 23 people make 253 pairs. With 50 people the chance is 97.0 per cent, with 70 people 99.9 per cent. The page takes every day of the year as equally likely and leaves out 29 February. Real birthdays are not spread quite evenly over the year, which raises these chances a little.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name="probability-birthdays" />
          <Equations system={system} />
        </>
      }
    />
  );
}
