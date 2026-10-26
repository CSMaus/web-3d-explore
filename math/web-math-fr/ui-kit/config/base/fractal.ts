import { defineFractal } from "../kinds.ts";

// the fractal behind the page: it grows from the top-right corner across the whole page and
// keeps clear of every element with the class fractal-obstacle (the kit's buttons, inputs,
// sliders, choice rows and panels carry it).
export const fractal = defineFractal({
  // true = shown, false = not drawn at all
  on: true,

  // what grows
  //   "flowsnake"   the Gosper curve, drawn outward from the top-right corner,
  //                 broken where it would cross an obstacle
  //   "branches"    a random branching growth that turns around obstacles
  shape: "flowsnake",

  // colour of the lines: a palette name, a tint like "glow/50", a hex, or "transparent"
  colour: "glow",

  // width of a line, in px
  stroke: 1,

  // opacity of the whole layer, 0 to 1; low, so text over it stays easy to read
  opacity: 0.15,

  // how much the lines differ in opacity, 0 to 1: 0 = all alike; higher = some lines much fainter
  // than others (a stretch of the flowsnake, or a whole branch, keeps one)
  vary: 0.7,

  // how far the lines drift in opacity over time, 0 to 1: 0 = still; higher = some lines slowly
  // fade and come back while others brighten
  drift: 0.6,

  // about how long one drift down and back takes, in seconds: higher = slower, smoother
  driftTime: 14,

  // waves that sweep out from the top-right corner: the fractal fades in as a wave arrives and
  // out as it passes. distance between two waves, in px; 0 = no waves, the fractal stays
  wave: 1600,

  // how long a wave takes to travel that distance, in seconds: higher = slower
  waveTime: 30,

  // how much of the fractal stays between two waves, 0 to 1: 0 = it fades out completely
  waveLow: 0,

  // length of one segment, in px: larger draws a larger fractal
  step: 36,

  // segments grown each frame: higher fills the page sooner, lower appears more slowly
  speed: 20,

  // how long the lines of each frame take to fade in, in ms; 0 = they appear at once
  fade: 900,

  // how unevenly it grows, 0 to 1: 0 = one even front from the corner; higher = some lines run
  // ahead of others, all still growing out of the corner
  chaos: 0.7,

  // chance a tip forks at each step, 0 to 1 (branches only)
  branch: 0.07,

  // how far a branch may bend at each step, in radians (branches only)
  bend: 0.28,

  // true = keeps clear of every element with the class fractal-obstacle (buttons, panels, text);
  // false = runs behind them all, and the gap below does nothing
  avoid: false,

  // space kept clear around each obstacle, in px
  gap: 10,

  // how densely the page fills: segments per million square px of page (branches only)
  density: 5000,
});
