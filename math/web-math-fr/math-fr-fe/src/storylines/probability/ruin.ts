import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the ruin page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { path: number; walls: number; bars: number };
export type Set = { coin: "fair" | "own" | "unfair" };
export type Top = "bets" | "coin" | "reach";
export type Act = "coin";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("A player has ten coins and wants twenty. The coin is almost fair."),
    fade: { path: 0, walls: 1, bars: 0 },
    set: { coin: "unfair" },
    top: "coin",
    act: null,
  },
  {
    id: "loses",
    say: L("Still he loses six games in ten."),
    fade: { path: 0, walls: 1, bars: 1 },
    set: { coin: "unfair" },
    top: "reach",
    act: null,
  },
  {
    id: "bet",
    say: L("Each bet is one coin. Heads adds one, tails takes one away."),
    fade: { path: 1, walls: 0, bars: 0 },
    set: { coin: "fair" },
    top: null,
    act: null,
  },
  {
    id: "walls",
    say: L("The game ends at twenty or at zero."),
    fade: { path: 1, walls: 1, bars: 0 },
    set: { coin: "fair" },
    top: null,
    act: null,
  },
  {
    id: "middle",
    say: L("With a fair coin he starts in the middle. Both walls are equally far."),
    fade: { path: 1, walls: 1, bars: 0 },
    set: { coin: "fair" },
    top: "coin",
    act: null,
  },
  {
    id: "half",
    say: L("So the chances are equal."),
    fade: { path: 0.4, walls: 1, bars: 1 },
    set: { coin: "fair" },
    top: "reach",
    act: null,
  },
  {
    id: "unfair",
    say: L("Now the coin is slightly unfair."),
    fade: { path: 1, walls: 1, bars: 0 },
    set: { coin: "unfair" },
    top: "coin",
    act: null,
  },
  {
    id: "long",
    say: L("A game lasts about a hundred tosses. The small tilt adds up."),
    fade: { path: 1, walls: 1, bars: 0 },
    set: { coin: "unfair" },
    top: "bets",
    act: null,
  },
  {
    id: "forty",
    say: L("He reaches the goal in forty games out of a hundred."),
    fade: { path: 0.4, walls: 1, bars: 1 },
    set: { coin: "unfair" },
    top: "reach",
    act: null,
  },
  {
    id: "change",
    say: L("Change the coin and the starting amount."),
    fade: { path: 0.4, walls: 1, bars: 1 },
    set: { coin: "own" },
    top: "reach",
    act: "coin",
  },
  {
    id: "casino",
    say: L("A casino works this way. The tilt is small and the game is long."),
    fade: { path: 0, walls: 1, bars: 1 },
    set: { coin: "unfair" },
    top: "reach",
    act: null,
  },
];
