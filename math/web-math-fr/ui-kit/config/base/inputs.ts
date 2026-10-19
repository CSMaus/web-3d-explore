import { defineInputs } from "../kinds.ts";

// text fields: the search box, the name of a saved parameter set.
export const inputs = defineInputs({
  // how a field looks
  //   "box"         border all round, same corners as buttons
  //   "underline"   only a line under it
  //   "filled"      no border, slightly lighter background
  style: "box",

  // height in px
  height: 40,

  // border width in px (for "box" and "underline")
  border: 1,

  // raw css for anything the fields above do not cover
  extraCss: "",
});
