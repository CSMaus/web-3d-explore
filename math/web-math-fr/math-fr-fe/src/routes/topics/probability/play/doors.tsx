import { createFileRoute } from "@tanstack/react-router";
import { Button, Swatch, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
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
import { EDGE, GROUND, INK, MUTED, ONE, SKY, TWO, blend } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, block, frame, label, line, pane, split } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import * as scene from "@/scenes/probability/doors";
import type { Values } from "@/scenes/probability/doors";
import { STEPS } from "@/storylines/probability/doors";
import type { Act } from "@/storylines/probability/doors";
import { doorsGame, pick, rngFrom } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/doors")({
  loader: () => api.system(TOPIC, "doors"),
  component: DoorsPage,
});

const GAMES = 1000;
const COUNTS = [
  { id: "3", label: L("3 doors") },
  { id: "100", label: L("100 doors") },
];
type Hand = { car: number; first: number; left: number; choice: "stay" | "switch" | null } | null;

function storyAct(act: Act, values: Values, change: (next: Values) => void) {
  switch (act) {
    case "hand":
      return (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={values.choice !== "none"} onClick={() => change(scene.decide(values, "stay"))}>
            {L("Keep the first door")}
          </Button>
          <Button variant="outline" size="sm" disabled={values.choice !== "none"} onClick={() => change(scene.decide(values, "switch"))}>
            {L("Switch to the other door")}
          </Button>
          <Button variant="outline" size="sm" disabled={values.choice === "none"} onClick={() => change(scene.deal(values))}>
            {L("Deal a new game")}
          </Button>
        </div>
      );
  }
}

/**
 * the doors game. one game by hand: pick a door, the host opens every other door but one, stay or
 * switch. then a thousand games of each choice, played from a seed, with the share of wins of each
 * drawn as the games go.
 */
function DoorsPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [doors, setDoors] = useState(3);
  const [perFrame, setPerFrame] = useState(4);
  const [n, setN] = useState(0);
  const [hand, setHand] = useState<Hand>(null);
  const [pickAt, setPickAt] = useState(1);
  const [tally, setTally] = useState({ stay: 0, stayWon: 0, swap: 0, swapWon: 0 });
  const handRng = useRef(rngFrom(17));
  const runner = useRunner((k) => setN(Math.min(GAMES, k)), { perFrame, stopAt: GAMES });
  // a thousand games for each choice, from separate draws, so the two runs are independent
  const games = useMemo(() => {
    const rng = rngFrom(doors);
    return Array.from({ length: GAMES }, () => ({ stay: doorsGame(doors, rng), swap: doorsGame(doors, rng) }));
  }, [doors]);
  const wins = useMemo(() => {
    let stay = 0;
    let swap = 0;
    const path: [number, number, number][] = [];
    for (let i = 0; i < n; i += 1) {
      if (games[i].stay.stayWins) stay += 1;
      if (games[i].swap.switchWins) swap += 1;
      path.push([i + 1, stay / (i + 1), swap / (i + 1)]);
    }
    return { stay, swap, path };
  }, [games, n]);

  const reset = () => {
    runner.reset();
    setN(0);
  };
  const start = (first: number) => {
    const rng = handRng.current;
    const car = pick(rng, doors);
    let left = car;
    if (first === car) {
      left = pick(rng, doors - 1);
      if (left >= first) left += 1;
    }
    setHand({ car, first, left, choice: null });
  };
  const decide = (choice: "stay" | "switch") => {
    if (!hand || hand.choice) return;
    const won = choice === "stay" ? hand.first === hand.car : hand.left === hand.car;
    setHand({ ...hand, choice });
    setTally((t) => (choice === "stay" ? { ...t, stay: t.stay + 1, stayWon: t.stayWon + (won ? 1 : 0) } : { ...t, swap: t.swap + 1, swapWon: t.swapWon + (won ? 1 : 0) }));
  };
  // the picture shows the game by hand while one is open, else the last game played by the run
  const shown = hand ?? (n > 0 ? { ...games[n - 1].swap, choice: "switch" as const } : null);
  const handWon = hand?.choice ? (hand.choice === "stay" ? hand.first === hand.car : hand.left === hand.car) : null;

  return (
    <TaskPage
      title={system?.name ?? L("Three doors: stay or switch")}
      job={L("Three doors, one car: is it better to stay or to switch?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("Number of doors")} note={L("Three doors is the usual game. With 100 doors the host opens 98 doors with goats and leaves one door closed besides the player's. Changing the number of doors starts the games again.")}>
            <Choices options={COUNTS} value={String(doors)} onPick={(id) => { setDoors(Number(id)); setHand(null); setPickAt(1); reset(); }} />
          </OptionGroup>
          <OptionGroup title={L("One game by hand")} note={L("Pick a door. The host opens all the other doors except one. Then stay with the first door or switch to the one left closed. Two lines of the result count every game played by hand.")}>
            {doors === 3 ? (
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((d) => (
                  <Button key={d} variant="outline" size="sm" onClick={() => start(d)} disabled={!!hand && !hand.choice}>
                    {L("Pick door {{d}}", { d: d + 1 })}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Slider label={L("Door to pick")} min={1} max={100} step={1} value={pickAt} format={(v) => String(Math.round(v))} onChange={(v) => setPickAt(Math.round(v))} />
                <Button variant="outline" size="sm" onClick={() => start(pickAt - 1)} disabled={!!hand && !hand.choice}>
                  {L("Pick this door")}
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => decide("stay")} disabled={!hand || !!hand.choice}>{L("Stay")}</Button>
              <Button variant="outline" size="sm" onClick={() => decide("switch")} disabled={!hand || !!hand.choice}>{L("Switch")}</Button>
              <Button variant="outline" size="sm" onClick={() => setHand(null)} disabled={!hand}>{L("Clear the game")}</Button>
            </div>
            <Text kind="note" as="p">
              {!hand
                ? L("No game by hand is open. Pick a door to start one.")
                : !hand.choice
                  ? L("Door {{f}} is picked. The host has opened all the other doors except door {{l}}, and every opened door shows a goat. Stay or switch?", { f: hand.first + 1, l: hand.left + 1 })
                  : handWon
                    ? L("The car was behind door {{c}}: this game is won.", { c: hand.car + 1 })
                    : L("The car was behind door {{c}}: this game is lost.", { c: hand.car + 1 })}
            </Text>
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={n}
          limit={GAMES}
          what={L("games with each choice")}
          onToggle={() => {
            if (!runner.running && n >= GAMES) reset();
            setHand(null);
            runner.toggle();
          }}
          onStep={(many) => { setHand(null); runner.once(many); }}
          onReset={reset}
          perFrame={perFrame}
          onSpeed={setPerFrame}
        />
      }
      picture={
        <section ref={stage}>
          <Text kind="note" as="div" className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
            <span><Swatch colour={TWO} />{L("Thin line: share won by staying")}</span>
            <span><Swatch colour={ONE} />{L("Thick line: share won by switching")}</span>
            <span><Swatch colour={SKY} />{L("The door left closed")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[shown, wins, doors]}
              draw={(pen) => {
                const [left, right] = split(pen, [2, 3]);
                const cols = doors === 3 ? 3 : 10;
                const rows = doors === 3 ? 1 : 10;
                const room = pane(pen, left, { x0: 0, x1: cols, y0: 0, y1: doors === 3 ? 2 : rows });
                const revealed = !!shown?.choice;
                for (let d = 0; d < doors; d += 1) {
                  const x = d % cols;
                  const y = (doors === 3 ? 0.2 : rows - 1 - Math.floor(d / cols));
                  const h = doors === 3 ? 1.6 : 0.85;
                  const open = shown ? d !== shown.first && d !== shown.left : false;
                  const car = revealed && shown && d === shown.car;
                  const colour = car ? ONE : open ? blend(GROUND, EDGE, 0.35) : shown && d === shown.left ? blend(GROUND, SKY, 0.7) : blend(GROUND, MUTED, 0.55);
                  block(pen, room, x + 0.1, y, x + 0.9, y + h, colour);
                  if (shown && d === shown.first) {
                    line(pen, room, [[x + 0.06, y - 0.04], [x + 0.94, y - 0.04], [x + 0.94, y + h + 0.04], [x + 0.06, y + h + 0.04], [x + 0.06, y - 0.04]], INK, 1.6);
                  }
                  if (doors === 3) label(pen, room, String(d + 1), x + 0.5, y + h + 0.12, MUTED, "center");
                }
                const g = pane(pen, right, { x0: 0, x1: GAMES, y0: 0, y1: 1 });
                frame(pen, g, { x: 250, y: 0.25 });
                pen.ctx.setLineDash([4, 4]);
                line(pen, g, [[0, 1 / doors], [GAMES, 1 / doors]], TWO, 1);
                line(pen, g, [[0, 1 - 1 / doors], [GAMES, 1 - 1 / doors]], ONE, 1);
                pen.ctx.setLineDash([]);
                line(pen, g, wins.path.map(([i, s]) => [i, s]), TWO, 1.2);
                line(pen, g, wins.path.map(([i, , w]) => [i, w]), ONE, 2.8);
              }}
            />
          </div>
          <Caption>
            {L("First picture (on the left, or on top on a narrow screen): the doors of the game being shown, the game by hand or else the last game of the run. The first pick has an outline. Opened doors are dark, and the door left closed is lighter. Once the game is decided, the car's door is the brightest. Second picture: the share of games won so far, across the 1000 games. The thick line is for switching and the thin line for staying. The dashed lines mark the expected shares: 1 - 1/n for switching and 1/n for staying, where n is the number of doors.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={n >= GAMES ? wins.swap > wins.stay : undefined}>
            {n === 0
              ? L("No game run yet. With {{d}} doors, the first pick hides the car one time in {{d}}. Press run to play a thousand games with each choice.", { d: doors })
              : L("After {{n}} games with each choice, staying won {{s}} times, a share of {{sp}}. Switching won {{w}} times, a share of {{wp}}.", { n, s: wins.stay, sp: (wins.stay / n).toFixed(3), w: wins.swap, wp: (wins.swap / n).toFixed(3) })}
          </Verdict>
          <Readout
            rows={[
              [L("Number of doors"), String(doors)],
              [L("Games played with each choice"), String(n)],
              [L("Share of games won by staying"), n ? (wins.stay / n).toFixed(3) : "-"],
              [L("Share of games won by switching"), n ? (wins.swap / n).toFixed(3) : "-"],
              [L("Expected share won by staying"), (1 / doors).toFixed(3)],
              [L("Expected share won by switching"), (1 - 1 / doors).toFixed(3)],
              [L("Games by hand with staying: won / played"), `${tally.stayWon} / ${tally.stay}`],
              [L("Games by hand with switching: won / played"), `${tally.swapWon} / ${tally.swap}`],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("Staying wins only when the first pick hid the car, one time in three. When the first pick was wrong, the host cannot open the car's door, so the car is behind the door he leaves closed, and switching wins. So switching wins two times in three. With 100 doors, switching wins 99 times in 100. The two closed doors are not equally likely because the host did not choose at random: he knew where the car was. If the host opened a door at random and it happened to show a goat, the two closed doors would be equally likely. A puzzle of this topic, 'A host who does not know', works through that case.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`probability-doors-${doors}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
