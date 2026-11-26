import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the memory page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { taxi: number; bus: number; split: number; shift: number };
export type Set = { waited: number };
export type Top = "ahead" | "bus" | "left" | "still";
export type Act = "waited";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("A person has waited ten minutes for a taxi. The wait ahead is as long as at the start."),
    fade: { taxi: 1, bus: 0, split: 0, shift: 0 },
    set: { waited: 10 },
    top: null,
    act: null,
  },
  {
    id: "bus",
    say: L("A bus is different. It runs on a timetable."),
    fade: { taxi: 0, bus: 1, split: 0, shift: 0 },
    set: { waited: 10 },
    top: "bus",
    act: null,
  },
  {
    id: "bus-left",
    say: L("Ten minutes have passed. So at most ten are left."),
    fade: { taxi: 0, bus: 1, split: 1, shift: 0 },
    set: { waited: 10 },
    top: "left",
    act: null,
  },
  {
    id: "taxi",
    say: L("Taxis come at random. A taxi does not know how long anyone has waited."),
    fade: { taxi: 1, bus: 0, split: 0, shift: 0 },
    set: { waited: 10 },
    top: null,
    act: null,
  },
  {
    id: "take",
    say: L("Take everyone who has already waited ten minutes."),
    fade: { taxi: 1, bus: 0, split: 1, shift: 0 },
    set: { waited: 10 },
    top: "still",
    act: null,
  },
  {
    id: "same",
    say: L("Their remaining wait has the same shape as the very first one."),
    fade: { taxi: 1, bus: 0, split: 1, shift: 1 },
    set: { waited: 10 },
    top: "still",
    act: null,
  },
  {
    id: "name",
    say: L("A wait like this is called memoryless."),
    fade: { taxi: 1, bus: 0, split: 1, shift: 1 },
    set: { waited: 10 },
    top: "ahead",
    act: null,
  },
  {
    id: "change",
    say: L("Change the time already waited."),
    fade: { taxi: 1, bus: 0, split: 1, shift: 1 },
    set: { waited: 10 },
    top: "ahead",
    act: "waited",
  },
];
