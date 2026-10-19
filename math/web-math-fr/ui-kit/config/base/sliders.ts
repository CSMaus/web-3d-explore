import { defineSliders } from "../kinds.ts";

// sliders, with their name and their number.
// text of the name: text.ts -> "field". text of the number: text.ts -> "fieldValue".
export const sliders = defineSliders({
  // thickness of the track, in px
  track: 4,

  // true  = the part left of the thumb is filled with the slider colour below
  // false = the whole track stays the border colour
  filled: true,

  // the thumb (the part that is dragged)
  //   "round"       circle
  //   "square"      square with soft corners
  //   "bar"         thin upright bar
  thumb: "round",

  // size of the thumb, in px
  thumbSize: 14,

  // colour of the filled track and the thumb: a palette name, a tint, a hex, or "transparent"
  colour: "primary",

  // where the number is shown
  //   "right"       name | slider | number, in one row
  //   "inline"      name and number in one row, slider under them
  //   "above"       same, number aligned to the right end
  value: "right",

  // raw css for anything the fields above do not cover
  extraCss: "",
});
