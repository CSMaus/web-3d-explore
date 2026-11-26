import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the test page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { field: number; ill: number; found: number; wrong: number; gather: number };
export type Set = { note: "claim" | "none" };
export type Top = "both" | "false-rate" | "finds" | "healthy-positive" | "ill" | "ill-positive" | "people" | "share";
export type Act = "prevalence";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("A test almost never misses the illness. Yet a person it calls ill is probably healthy."),
    fade: { field: 0, ill: 0, found: 0, wrong: 0, gather: 0 },
    set: { note: "claim" },
    top: "finds",
    act: null,
  },
  {
    id: "count",
    say: L("The reason shows when people are counted instead of per cents."),
    fade: { field: 0, ill: 0, found: 0, wrong: 0, gather: 0 },
    set: { note: "claim" },
    top: null,
    act: null,
  },
  {
    id: "field",
    say: L("Here are a hundred thousand people. Each dot is one person."),
    fade: { field: 1, ill: 0, found: 0, wrong: 0, gather: 0 },
    set: { note: "none" },
    top: "people",
    act: null,
  },
  {
    id: "ill",
    say: L("One person in a thousand is ill."),
    fade: { field: 1, ill: 1, found: 0, wrong: 0, gather: 0 },
    set: { note: "none" },
    top: "ill",
    act: null,
  },
  {
    id: "found",
    say: L("The test finds nearly all of the ill."),
    fade: { field: 1, ill: 1, found: 1, wrong: 0, gather: 0 },
    set: { note: "none" },
    top: "ill-positive",
    act: null,
  },
  {
    id: "rare",
    say: L("It is rarely wrong about the healthy: five times in a hundred."),
    fade: { field: 1, ill: 1, found: 1, wrong: 0, gather: 0 },
    set: { note: "none" },
    top: "false-rate",
    act: null,
  },
  {
    id: "many",
    say: L("But the healthy are very many. The mistakes add up to thousands."),
    fade: { field: 1, ill: 1, found: 1, wrong: 1, gather: 0 },
    set: { note: "none" },
    top: "healthy-positive",
    act: null,
  },
  {
    id: "gather",
    say: L("Put everyone with a positive result side by side."),
    fade: { field: 0.25, ill: 0, found: 0, wrong: 0, gather: 1 },
    set: { note: "none" },
    top: "both",
    act: null,
  },
  {
    id: "share",
    say: L("Fewer than two in a hundred of them are ill."),
    fade: { field: 0.25, ill: 0, found: 0, wrong: 0, gather: 1 },
    set: { note: "none" },
    top: "share",
    act: null,
  },
  {
    id: "common",
    say: L("Make the illness common and watch the share change."),
    fade: { field: 0.25, ill: 0, found: 0, wrong: 0, gather: 1 },
    set: { note: "none" },
    top: "share",
    act: "prevalence",
  },
  {
    id: "bayes",
    say: L("This way of counting is called Bayes' rule."),
    fade: { field: 0.25, ill: 0, found: 0, wrong: 0, gather: 1 },
    set: { note: "none" },
    top: "share",
    act: null,
  },
];
