import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the doors page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { three: number; hundred: number; pulse: number };
export type Set = { stage: "closed" | "hand" | "opened" | "picked" | "revealed"; doors: number };
export type Top = "doors" | "first" | "tally";
export type Act = "hand";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("Three doors, and a car behind one. Those who switch win twice as often."),
    fade: { three: 1, hundred: 0, pulse: 0 },
    set: { stage: "closed", doors: 3 },
    top: null,
    act: null,
  },
  {
    id: "pick",
    say: L("The player picks a door."),
    fade: { three: 1, hundred: 0, pulse: 0 },
    set: { stage: "picked", doors: 3 },
    top: null,
    act: null,
  },
  {
    id: "host",
    say: L("The host knows where the car is. He opens another door, with a goat."),
    fade: { three: 1, hundred: 0, pulse: 0 },
    set: { stage: "opened", doors: 3 },
    top: null,
    act: null,
  },
  {
    id: "even",
    say: L("Two doors are left. The chances look equal."),
    fade: { three: 1, hundred: 0, pulse: 0 },
    set: { stage: "opened", doors: 3 },
    top: null,
    act: null,
  },
  {
    id: "play",
    say: L("Play a few games. Stay or switch each time."),
    fade: { three: 1, hundred: 0, pulse: 0 },
    set: { stage: "hand", doors: 3 },
    top: "tally",
    act: "hand",
  },
  {
    id: "hundred",
    say: L("Now there are a hundred doors."),
    fade: { three: 0, hundred: 1, pulse: 0 },
    set: { stage: "closed", doors: 100 },
    top: "doors",
    act: null,
  },
  {
    id: "all-but",
    say: L("The player picks one. The host opens all the others except one."),
    fade: { three: 0, hundred: 1, pulse: 0 },
    set: { stage: "opened", doors: 100 },
    top: "doors",
    act: null,
  },
  {
    id: "skipped",
    say: L("He walked past one single door. Is the first door still the better one?"),
    fade: { three: 0, hundred: 1, pulse: 1 },
    set: { stage: "opened", doors: 100 },
    top: "doors",
    act: null,
  },
  {
    id: "why",
    say: L("The first pick is right once in a hundred. Otherwise the car is there."),
    fade: { three: 0, hundred: 1, pulse: 0 },
    set: { stage: "revealed", doors: 100 },
    top: "first",
    act: null,
  },
  {
    id: "three-again",
    say: L("With three doors it is the same. The first pick is right once in three."),
    fade: { three: 1, hundred: 0, pulse: 0 },
    set: { stage: "revealed", doors: 3 },
    top: "first",
    act: null,
  },
];
