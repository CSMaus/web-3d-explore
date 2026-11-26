import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the poisson page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { line: number; slices: number; curve: number };
export type Set = { n: number };
export type Top = "limit" | "mean" | "slices";
export type Act = "mean";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("Calls come three times a minute on average. Still, one minute in twenty is silent."),
    fade: { line: 1, slices: 0, curve: 0 },
    set: { n: 0 },
    top: "mean",
    act: null,
  },
  {
    id: "random",
    say: L("The calls come at random moments."),
    fade: { line: 1, slices: 0, curve: 0 },
    set: { n: 0 },
    top: "mean",
    act: null,
  },
  {
    id: "six",
    say: L("Cut one minute into six slices."),
    fade: { line: 0, slices: 1, curve: 0 },
    set: { n: 6 },
    top: "slices",
    act: null,
  },
  {
    id: "coin",
    say: L("In each slice a call either comes or does not."),
    fade: { line: 0, slices: 1, curve: 0 },
    set: { n: 6 },
    top: "slices",
    act: null,
  },
  {
    id: "sixty",
    say: L("Cut finer. Sixty slices."),
    fade: { line: 0, slices: 1, curve: 1 },
    set: { n: 60 },
    top: "slices",
    act: null,
  },
  {
    id: "six-hundred",
    say: L("Six hundred slices. The chance of silence has stopped changing."),
    fade: { line: 0, slices: 1, curve: 1 },
    set: { n: 600 },
    top: "slices",
    act: null,
  },
  {
    id: "e",
    say: L("It has arrived at a number built from the constant e."),
    fade: { line: 0, slices: 0.4, curve: 1 },
    set: { n: 600 },
    top: "limit",
    act: null,
  },
  {
    id: "mean",
    say: L("Change the average number of calls."),
    fade: { line: 0, slices: 0.4, curve: 1 },
    set: { n: 600 },
    top: "limit",
    act: "mean",
  },
  {
    id: "uses",
    say: L("Misprints, accidents and decaying atoms are counted the same way."),
    fade: { line: 1, slices: 0, curve: 0 },
    set: { n: 0 },
    top: "limit",
    act: null,
  },
];
