import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the walks page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { fan: number; envelope: number; side: number; hist: number };
export type Set = { count: number };
export type Top = "players" | "spread";
export type Act = "again";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("The coin is fair. Yet a player often stays on one side nearly all the time."),
    fade: { fan: 1, envelope: 0, side: 0, hist: 0 },
    set: { count: 50 },
    top: "players",
    act: null,
  },
  {
    id: "step",
    say: L("Heads is one step up. Tails is one step down."),
    fade: { fan: 1, envelope: 0, side: 0, hist: 0 },
    set: { count: 1 },
    top: "players",
    act: null,
  },
  {
    id: "ten",
    say: L("Now ten players at once."),
    fade: { fan: 1, envelope: 0, side: 0, hist: 0 },
    set: { count: 10 },
    top: "players",
    act: null,
  },
  {
    id: "fifty",
    say: L("And fifty."),
    fade: { fan: 1, envelope: 0, side: 0, hist: 0 },
    set: { count: 50 },
    top: "players",
    act: null,
  },
  {
    id: "root",
    say: L("Four times as many tosses spread the lines only twice as far."),
    fade: { fan: 1, envelope: 1, side: 0, hist: 0 },
    set: { count: 50 },
    top: "spread",
    act: null,
  },
  {
    id: "cross",
    say: L("A line might be expected to cross zero often."),
    fade: { fan: 1, envelope: 0, side: 0, hist: 0 },
    set: { count: 50 },
    top: null,
    act: null,
  },
  {
    id: "stay",
    say: L("Instead it goes to one side and stays there for long."),
    fade: { fan: 0.25, envelope: 0, side: 1, hist: 0 },
    set: { count: 50 },
    top: null,
    act: null,
  },
  {
    id: "hist",
    say: L("The likeliest result is nearly all the time above zero. Or nearly all of it below."),
    fade: { fan: 0.25, envelope: 0, side: 0, hist: 1 },
    set: { count: 50 },
    top: null,
    act: null,
  },
  {
    id: "again",
    say: L("Run fifty new walks and look again."),
    fade: { fan: 1, envelope: 0, side: 0, hist: 0 },
    set: { count: 50 },
    top: "players",
    act: "again",
  },
];
