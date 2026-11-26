import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the galton page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { pile: number; paths: number; counts: number; triangle: number };
export type Set = { rows: number; ball: number };
export type Top = "row" | "tilt";
export type Act = "tilt";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("Every ball falls at random. Yet the pile always has the same shape."),
    fade: { pile: 1, paths: 0, counts: 0, triangle: 0 },
    set: { rows: 12, ball: 0 },
    top: null,
    act: null,
  },
  {
    id: "pin",
    say: L("At a pin the ball goes left or right. The chances are equal."),
    fade: { pile: 0, paths: 0, counts: 0, triangle: 0 },
    set: { rows: 1, ball: 1 },
    top: null,
    act: null,
  },
  {
    id: "row-one",
    say: L("One row of pins gives two bins."),
    fade: { pile: 0, paths: 0, counts: 1, triangle: 0 },
    set: { rows: 1, ball: 1 },
    top: "row",
    act: null,
  },
  {
    id: "row-two",
    say: L("Two rows give three bins. Two paths lead to the middle one."),
    fade: { pile: 0, paths: 1, counts: 1, triangle: 0 },
    set: { rows: 2, ball: 0 },
    top: "row",
    act: null,
  },
  {
    id: "row-three",
    say: L("Three rows."),
    fade: { pile: 0, paths: 1, counts: 1, triangle: 0 },
    set: { rows: 3, ball: 0 },
    top: "row",
    act: null,
  },
  {
    id: "row-four",
    say: L("Four rows."),
    fade: { pile: 0, paths: 1, counts: 1, triangle: 0 },
    set: { rows: 4, ball: 0 },
    top: "row",
    act: null,
  },
  {
    id: "middle",
    say: L("Most paths lead to the middle. So most balls land there."),
    fade: { pile: 1, paths: 0, counts: 1, triangle: 0 },
    set: { rows: 12, ball: 0 },
    top: null,
    act: null,
  },
  {
    id: "pascal",
    say: L("These numbers are called Pascal's triangle."),
    fade: { pile: 0, paths: 0, counts: 0, triangle: 1 },
    set: { rows: 6, ball: 0 },
    top: "row",
    act: null,
  },
  {
    id: "tilt",
    say: L("Tilt the board. The pile moves, and its bell shape stays."),
    fade: { pile: 1, paths: 0, counts: 0, triangle: 0 },
    set: { rows: 12, ball: 0 },
    top: "tilt",
    act: "tilt",
  },
];
