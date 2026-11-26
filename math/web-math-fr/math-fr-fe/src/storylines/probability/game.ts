import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the game page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { deal: number; six: number; path: number; line: number };
export type Set = { mark: "cost" | "net" | "none" | "prize"; rounds: number };
export type Top = "mean" | "paid" | "stakes" | "total" | "won";
export type Act = "play";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("A six pays five times the stake. The game looks profitable."),
    fade: { deal: 1, six: 0, path: 0, line: 0 },
    set: { mark: "none", rounds: 0 },
    top: "stakes",
    act: null,
  },
  {
    id: "six",
    say: L("Play six rounds. Let every face come up once."),
    fade: { deal: 0, six: 1, path: 0, line: 0 },
    set: { mark: "none", rounds: 0 },
    top: "stakes",
    act: null,
  },
  {
    id: "paid",
    say: L("Six stakes cost twelve coins."),
    fade: { deal: 0, six: 1, path: 0, line: 0 },
    set: { mark: "cost", rounds: 0 },
    top: "paid",
    act: null,
  },
  {
    id: "won",
    say: L("The prize came once."),
    fade: { deal: 0, six: 1, path: 0, line: 0 },
    set: { mark: "prize", rounds: 0 },
    top: "won",
    act: null,
  },
  {
    id: "third",
    say: L("Six rounds lost two coins. That is a third of a coin per round."),
    fade: { deal: 0, six: 1, path: 0, line: 0 },
    set: { mark: "net", rounds: 0 },
    top: "mean",
    act: null,
  },
  {
    id: "name",
    say: L("This number is called the expected gain."),
    fade: { deal: 0, six: 1, path: 0, line: 0 },
    set: { mark: "net", rounds: 0 },
    top: "mean",
    act: null,
  },
  {
    id: "twenty",
    say: L("Play twenty rounds. A short game can end above zero."),
    fade: { deal: 0, six: 0, path: 1, line: 0 },
    set: { mark: "none", rounds: 20 },
    top: "total",
    act: "play",
  },
  {
    id: "thousand",
    say: L("And now a thousand rounds."),
    fade: { deal: 0, six: 0, path: 1, line: 1 },
    set: { mark: "none", rounds: 1000 },
    top: "total",
    act: null,
  },
  {
    id: "pull",
    say: L("Chance moves the line up and down. The average takes it down every round."),
    fade: { deal: 0, six: 0, path: 1, line: 1 },
    set: { mark: "none", rounds: 1000 },
    top: "total",
    act: null,
  },
  {
    id: "long",
    say: L("Over a long game the average wins."),
    fade: { deal: 0, six: 0, path: 1, line: 1 },
    set: { mark: "none", rounds: 1000 },
    top: "mean",
    act: null,
  },
];
