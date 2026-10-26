import { defineButtons } from "../kinds.ts";

// buttons: every button, the chips of a choice, the tabs.
//
// colour values, everywhere below:
//   "primary"        a name from colours.ts (background, card, foreground, muted-foreground, border, primary, secondary, destructive, selected, glow, value)
//   "primary/14"     that colour at 14% (a tint)
//   "#7ff0d8"       any hex
//   "transparent"   nothing
//
// text of the buttons (font, size, weight, case): text.ts -> "button"
export const buttons = defineButtons({
  // corners of every button
  //   "square"      sharp corners
  //   "rounded"     same corner as panels (panels.ts -> corner)
  //   "pill"        fully round ends
  //   "underline"   no box, only a line under the text
  shape: "pill",

  // space inside the button, in px: [top and bottom, left and right]
  padding: [9, 16],
  // the same for a small button inside a panel: Auto, Manual, Reset view, One step
  compact: [5, 10],

  // extra effect on hover, besides the colours below
  //   "none"
  //   "lift"        moves up 1px and gets a shadow
  //   "brighten"    8% brighter
  motion: "none",

  // plain = the ordinary button: <Button variant="outline">, "secondary", "ghost",
  // and also every chip of a choice and every tab.
  // each state has:
  //   border   width of the border in px. 0 = no border
  //   edge     colour of the border
  //   fill     background colour
  //   ink      text colour
  plain: {
    // normal
    rest: { border: 1, edge: "transparent", fill: "transparent", ink: "muted-foreground" },
    // mouse over it: the same look, the contour light alone marks the hover (glow.hover below)
    hover: { border: 1, edge: "transparent", fill: "transparent", ink: "muted-foreground" },
    // mouse held down, or selected: the chosen chip, the active tab
    pressed: { border: 1, edge: "primary", fill: "transparent", ink: "primary" },
  },

  // primary = the one main button: <Button> with no variant (Run, Donate, Start with fractals)
  primary: {
    rest: { border: 1, edge: "primary", fill: "primary", ink: "background" },
    hover: { border: 1, edge: "primary", fill: "primary", ink: "background" },
    pressed: { border: 1, edge: "foreground", fill: "foreground", ink: "background" },
    // font weight of the primary button only, 100..900. remove the line to use text.ts -> "button"
    weight: 600,
    // a different shape for the primary only. remove the line to use the shape above
    // shape: "pill",
  },

  // the light on the primary button's contour
  //   on       true: a thin line of light on the primary button's edge, always; "hover": only under the pointer and while pressed; false: none
  //   hover    true or false: the plain button's edge brightens the same way under the pointer
  //   colour   the light's colour
  //   blur     how far it spreads, in px
  // the plain button frosted like the top bar: the page colour at tint per cent over what lies
  // behind it, blurred by blur px; the pressed state keeps its own fill. on: true or false
  glow: { on: false, hover: true, colour: "glow", blur: 14 },
  glass: { on: true, tint: 70, blur: 12 },

  // a disabled button: 1 = fully visible, 0 = invisible
  disabled: 0.4,

  // raw css for every button, for anything the fields above do not cover. example:
  // extraCss: "[data-slot=\"button\"] { text-decoration: underline; }"
  extraCss: "",
});
