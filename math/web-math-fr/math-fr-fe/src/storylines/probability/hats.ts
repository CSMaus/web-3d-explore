import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the hats page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { crowd: number; six: number; marks: number; one: number; sum: number };
export type Set = { hats: number };
export type Top = "average" | "hats" | "last" | "matches" | "own" | "sum" | "ways";
export type Act = "shuffle";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("A hundred people hand in their hats. The hats come back at random."),
    fade: { crowd: 1, six: 0, marks: 0, one: 0, sum: 0 },
    set: { hats: 100 },
    top: "hats",
    act: null,
  },
  {
    id: "average",
    say: L("On average, exactly one person gets their own hat back."),
    fade: { crowd: 1, six: 0, marks: 0, one: 0, sum: 0 },
    set: { hats: 100 },
    top: "average",
    act: null,
  },
  {
    id: "three",
    say: L("Take three hats. They can come back in six ways."),
    fade: { crowd: 0, six: 1, marks: 0, one: 0, sum: 0 },
    set: { hats: 3 },
    top: "ways",
    act: null,
  },
  {
    id: "count",
    say: L("Count the people who got their own hat."),
    fade: { crowd: 0, six: 1, marks: 1, one: 0, sum: 0 },
    set: { hats: 3 },
    top: "ways",
    act: null,
  },
  {
    id: "six-six",
    say: L("Six matches in six ways. That is one on average."),
    fade: { crowd: 0, six: 1, marks: 1, one: 0, sum: 0 },
    set: { hats: 3 },
    top: "matches",
    act: null,
  },
  {
    id: "why",
    say: L("Why is it always one? Look at a single person."),
    fade: { crowd: 0, six: 0, marks: 0, one: 1, sum: 0 },
    set: { hats: 100 },
    top: null,
    act: null,
  },
  {
    id: "hundredth",
    say: L("Among a hundred hats, theirs comes once in a hundred."),
    fade: { crowd: 0, six: 0, marks: 0, one: 1, sum: 0 },
    set: { hats: 100 },
    top: "own",
    act: null,
  },
  {
    id: "add",
    say: L("There are a hundred such people. A hundred hundredths make one."),
    fade: { crowd: 0, six: 0, marks: 0, one: 0.4, sum: 1 },
    set: { hats: 100 },
    top: "sum",
    act: null,
  },
  {
    id: "linked",
    say: L("Averages add up, even when the events are linked."),
    fade: { crowd: 0, six: 0, marks: 0, one: 0, sum: 1 },
    set: { hats: 100 },
    top: "sum",
    act: null,
  },
  {
    id: "shuffle",
    say: L("Shuffle the hats and count the matches."),
    fade: { crowd: 1, six: 0, marks: 0, one: 0, sum: 0 },
    set: { hats: 100 },
    top: "last",
    act: "shuffle",
  },
];
