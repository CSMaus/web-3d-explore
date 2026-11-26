import { L } from "@/lib/lang";
import type { StoryStep } from "@/lib/storyline";

/**
 * the story of the birthdays page of the probability topic: one sentence and one change of the picture a step.
 * fade: parts of the picture, 0 hidden to 1 shown, eased by the page. set: values that switch at once.
 * top: which line stands above the picture. act: the one thing the reader can do on this step.
 */
export type Fade = { ring: number; year: number; web: number; bar: number };
export type Set = { people: number; pair: number };
export type Top = "differ" | "pairs" | "pairs-chance" | "people";
export type Act = "people";

export const STEPS: StoryStep<Fade, Set, Top, Act>[] = [
  {
    id: "hook",
    say: L("There are twenty-three people in a room. Two of them probably share a birthday."),
    fade: { ring: 1, year: 0, web: 0, bar: 0 },
    set: { people: 23, pair: 1 },
    top: "people",
    act: null,
  },
  {
    id: "few",
    say: L("That seems too few people. A year has many more days."),
    fade: { ring: 0.4, year: 1, web: 0, bar: 0 },
    set: { people: 23, pair: 0 },
    top: null,
    act: null,
  },
  {
    id: "any-pair",
    say: L("But a match can be between any two people, not with one given person."),
    fade: { ring: 1, year: 0, web: 0, bar: 0 },
    set: { people: 23, pair: 1 },
    top: null,
    act: null,
  },
  {
    id: "two",
    say: L("Two people make one pair."),
    fade: { ring: 1, year: 0, web: 1, bar: 0 },
    set: { people: 2, pair: 0 },
    top: "pairs",
    act: null,
  },
  {
    id: "three",
    say: L("Three people make three pairs."),
    fade: { ring: 1, year: 0, web: 1, bar: 0 },
    set: { people: 3, pair: 0 },
    top: "pairs",
    act: null,
  },
  {
    id: "four",
    say: L("Four people already make six."),
    fade: { ring: 1, year: 0, web: 1, bar: 0 },
    set: { people: 4, pair: 0 },
    top: "pairs",
    act: null,
  },
  {
    id: "web",
    say: L("Twenty-three people make hundreds of pairs."),
    fade: { ring: 1, year: 0, web: 1, bar: 0 },
    set: { people: 23, pair: 0 },
    top: "pairs",
    act: null,
  },
  {
    id: "slide",
    say: L("Change the number of people and watch the chance."),
    fade: { ring: 1, year: 0, web: 1, bar: 0 },
    set: { people: 23, pair: 0 },
    top: "pairs-chance",
    act: "people",
  },
  {
    id: "flip",
    say: L("It is easier to count the opposite. The chance that all the days differ."),
    fade: { ring: 0.3, year: 0, web: 0, bar: 1 },
    set: { people: 23, pair: 0 },
    top: "differ",
    act: null,
  },
  {
    id: "half",
    say: L("At the twenty-third person it falls below one half."),
    fade: { ring: 0.3, year: 0, web: 0, bar: 1 },
    set: { people: 23, pair: 2 },
    top: "differ",
    act: null,
  },
];
