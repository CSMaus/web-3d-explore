import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the fourier page of the series topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { proj: number; strip: number; ghost: number; target: number; list: number };
export type Set = { mode: "draw" | "own" | "wave"; wave: "sawtooth" | "square"; count: number };
export type Top = "arrows" | "formula" | "kept" | "sum" | "tip";
export type Act = "count" | "own";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("Arrows are drawing this cat. All they can do is spin."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 0, list: 0 },
    set: { mode: "draw", wave: "square", count: 60 },
    top: "arrows",
    act: null,
  },
  {
    id: "one",
    say: L("Start with one. One end is pinned, the other goes round, like a clock hand."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 0, list: 0 },
    set: { mode: "wave", wave: "square", count: 1 },
    top: "arrows",
    act: null,
  },
  {
    id: "height",
    say: L("Watch only how high the tip is. Up, down, up again."),
    fade: { proj: 1, strip: 0, ghost: 0, target: 0, list: 0 },
    set: { mode: "wave", wave: "square", count: 1 },
    top: "tip",
    act: null,
  },
  {
    id: "strip",
    say: L("Pull a paper strip past it. The height leaves a wave on the strip."),
    fade: { proj: 1, strip: 1, ghost: 0, target: 0, list: 0 },
    set: { mode: "wave", wave: "square", count: 1 },
    top: "tip",
    act: null,
  },
  {
    id: "sine",
    say: L("This wave has a name: the sine. No wave is simpler."),
    fade: { proj: 1, strip: 1, ghost: 0, target: 0, list: 0 },
    set: { mode: "wave", wave: "square", count: 1 },
    top: "sum",
    act: null,
  },
  {
    id: "second",
    say: L("Hook a second arrow onto the tip of the first. Three times shorter, three times faster."),
    fade: { proj: 1, strip: 1, ghost: 0, target: 0, list: 0 },
    set: { mode: "wave", wave: "square", count: 2 },
    top: "sum",
    act: null,
  },
  {
    id: "flatter",
    say: L("The two heights add up. The top of the wave got flatter."),
    fade: { proj: 1, strip: 1, ghost: 0, target: 0, list: 0 },
    set: { mode: "wave", wave: "square", count: 2 },
    top: "sum",
    act: null,
  },
  {
    id: "third",
    say: L("A third: five times shorter, five times faster. More can be added with the button."),
    fade: { proj: 1, strip: 1, ghost: 0, target: 0, list: 0 },
    set: { mode: "wave", wave: "square", count: 3 },
    top: "sum",
    act: "count",
  },
  {
    id: "twelve",
    say: L("Twelve arrows. Smooth circles have added up to a square step."),
    fade: { proj: 1, strip: 1, ghost: 1, target: 0, list: 0 },
    set: { mode: "wave", wave: "square", count: 12 },
    top: "sum",
    act: null,
  },
  {
    id: "saw",
    say: L("Change the lengths and the speeds. The same chain now draws a sawtooth."),
    fade: { proj: 1, strip: 1, ghost: 1, target: 0, list: 0 },
    set: { mode: "wave", wave: "sawtooth", count: 12 },
    top: "sum",
    act: null,
  },
  {
    id: "lift",
    say: L("Now take the strip away. Let the tip of the chain leave its own trace."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 0, list: 0 },
    set: { mode: "draw", wave: "square", count: 1 },
    top: "arrows",
    act: null,
  },
  {
    id: "two",
    say: L("One arrow draws a circle. Two arrows already draw something else."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 0, list: 0 },
    set: { mode: "draw", wave: "square", count: 2 },
    top: "arrows",
    act: null,
  },
  {
    id: "any",
    say: L("Let each arrow have any length and any speed. Let it spin either way."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 1, list: 0 },
    set: { mode: "draw", wave: "square", count: 5 },
    top: "arrows",
    act: null,
  },
  {
    id: "add",
    say: L("Add them one at a time. Each one hooks onto the end and corrects the drawing."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 1, list: 0 },
    set: { mode: "draw", wave: "square", count: 6 },
    top: "arrows",
    act: "count",
  },
  {
    id: "forty",
    say: L("Forty arrows. That is a cat."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 1, list: 0 },
    set: { mode: "draw", wave: "square", count: 40 },
    top: "arrows",
    act: null,
  },
  {
    id: "list",
    say: L("The whole cat is now a list. Each row holds a length, a speed and a starting angle."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 0, list: 1 },
    set: { mode: "draw", wave: "square", count: 40 },
    top: "arrows",
    act: null,
  },
  {
    id: "series",
    say: L("Such a list is called a Fourier series. One term of the formula is one arrow."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 0, list: 1 },
    set: { mode: "draw", wave: "square", count: 40 },
    top: "formula",
    act: null,
  },
  {
    id: "short",
    say: L("The short arrows barely change the drawing. Throw them away and look."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 1, list: 0 },
    set: { mode: "draw", wave: "square", count: 40 },
    top: "kept",
    act: "count",
  },
  {
    id: "squeeze",
    say: L("Music and photos are squeezed the same way. The weak parts are thrown away."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 1, list: 0 },
    set: { mode: "draw", wave: "square", count: 12 },
    top: "kept",
    act: null,
  },
  {
    id: "own",
    say: L("Now a drawing of one's own. One line, drawn without lifting the hand."),
    fade: { proj: 0, strip: 0, ghost: 0, target: 0, list: 0 },
    set: { mode: "own", wave: "square", count: 50 },
    top: "arrows",
    act: "own",
  },
];
