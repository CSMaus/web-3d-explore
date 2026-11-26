import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the dice page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { chart: number; one: number; two: number; grid: number; blink: number };
export type Set = { sum: number };
export type Top = "cells" | "chance" | "faces" | "share" | "throws";
export type Act = "sum";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("Two dice were thrown five thousand times. Seven came up most often."),
    fade: { chart: 1, one: 0, two: 0, grid: 0, blink: 0 },
    set: { sum: 0 },
    top: "throws",
    act: null,
  },
  {
    id: "why",
    say: L("The dice are fair. So where does seven get its lead?"),
    fade: { chart: 0.3, one: 0, two: 0, grid: 0, blink: 0 },
    set: { sum: 0 },
    top: null,
    act: null,
  },
  {
    id: "one",
    say: L("On one die no face is favoured. Six faces, equal chances."),
    fade: { chart: 0, one: 1, two: 0, grid: 0, blink: 0 },
    set: { sum: 0 },
    top: "faces",
    act: null,
  },
  {
    id: "two",
    say: L("Take two dice. Call them the first and the second."),
    fade: { chart: 0, one: 0, two: 1, grid: 0, blink: 0 },
    set: { sum: 0 },
    top: null,
    act: null,
  },
  {
    id: "grid",
    say: L("Give every pair its own cell."),
    fade: { chart: 0, one: 0, two: 1, grid: 1, blink: 0 },
    set: { sum: 0 },
    top: "cells",
    act: null,
  },
  {
    id: "equal",
    say: L("There are thirty-six cells. Each one comes up equally often."),
    fade: { chart: 0, one: 0, two: 1, grid: 1, blink: 1 },
    set: { sum: 0 },
    top: "cells",
    act: null,
  },
  {
    id: "sum-two",
    say: L("A sum of two comes from one cell only."),
    fade: { chart: 0, one: 0, two: 1, grid: 1, blink: 0 },
    set: { sum: 2 },
    top: "share",
    act: null,
  },
  {
    id: "sum-seven",
    say: L("A sum of seven comes from a whole diagonal."),
    fade: { chart: 0, one: 0, two: 1, grid: 1, blink: 0 },
    set: { sum: 7 },
    top: "share",
    act: null,
  },
  {
    id: "pick",
    say: L("Pick a sum and count its cells."),
    fade: { chart: 0, one: 0, two: 1, grid: 1, blink: 0 },
    set: { sum: 7 },
    top: "share",
    act: "sum",
  },
  {
    id: "chance",
    say: L("A probability is a share of the cells. Now check it with throws."),
    fade: { chart: 0.6, one: 0, two: 0, grid: 1, blink: 0 },
    set: { sum: 7 },
    top: "chance",
    act: null,
  },
];
