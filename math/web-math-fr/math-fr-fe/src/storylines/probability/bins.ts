import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the bins page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { marks: number; bars: number; narrow: number; curve: number; area: number };
export type Set = { cut: number; bins: number };
export type Top = "beyond" | "waits" | "width";
export type Act = "cut";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("A taxi comes every ten minutes on average. One wait in seven lasts over twenty."),
    fade: { marks: 0, bars: 0, narrow: 0, curve: 1, area: 1 },
    set: { cut: 20, bins: 10 },
    top: "beyond",
    act: null,
  },
  {
    id: "marks",
    say: L("Here are ten thousand waits. Each one is a mark on the line."),
    fade: { marks: 1, bars: 0, narrow: 0, curve: 0, area: 0 },
    set: { cut: 20, bins: 10 },
    top: "waits",
    act: null,
  },
  {
    id: "five",
    say: L("Sort them into bins five minutes wide."),
    fade: { marks: 0.4, bars: 1, narrow: 0, curve: 0, area: 0 },
    set: { cut: 20, bins: 10 },
    top: "width",
    act: null,
  },
  {
    id: "narrower",
    say: L("Make the bins narrower. And narrower still."),
    fade: { marks: 0, bars: 1, narrow: 1, curve: 0, area: 0 },
    set: { cut: 20, bins: 100 },
    top: "width",
    act: null,
  },
  {
    id: "curve",
    say: L("The bars have merged into a curve."),
    fade: { marks: 0, bars: 0.4, narrow: 1, curve: 1, area: 0 },
    set: { cut: 20, bins: 100 },
    top: null,
    act: null,
  },
  {
    id: "area",
    say: L("From now on a probability is an area under the curve."),
    fade: { marks: 0, bars: 0, narrow: 0, curve: 1, area: 1 },
    set: { cut: 20, bins: 10 },
    top: "beyond",
    act: null,
  },
  {
    id: "move",
    say: L("Move the border and watch the area."),
    fade: { marks: 0, bars: 0, narrow: 0, curve: 1, area: 1 },
    set: { cut: 20, bins: 10 },
    top: "beyond",
    act: "cut",
  },
  {
    id: "seventh",
    say: L("Beyond twenty minutes lies about a seventh of the area."),
    fade: { marks: 0, bars: 0, narrow: 0, curve: 1, area: 1 },
    set: { cut: 20, bins: 10 },
    top: "beyond",
    act: null,
  },
];
