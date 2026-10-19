import { defineColours } from "../kinds.ts";

// the palette, once for dark and once for light. every other config file refers
// to these by name ("primary", "muted-foreground", ...) and gets the value of the mode in use.
// values: hex, like "#0a0d12"
export const colours = defineColours({
  // the mode a visitor gets before choosing one
  //   "dark"
  //   "light"
  default: "dark",

  dark: {
    // page background
    background: "#0a0d12",
    // background of panels and cards
    card: "#0f1318",
    // main text colour, and lines
    foreground: "#f2f4f7",
    // secondary text: labels, captions, slider names, top bar links when not active
    "muted-foreground": "#98a1ab",
    // borders, rules, grid lines, slider track
    border: "#1f262e",
    // the brand colour: tags, focus ring, links, the primary button, first line in a plot; also the glow, the
    // selected colour and the numbers, since this palette leaves glow, selected and value out
    primary: "#7ff0d8",
    // the second brand colour: second line in a plot, and the tint behind a hovered row of the registry elements
    secondary: "#9b8cf5",
    // colours of lines in a plot, in order (first = line 1, second = line 2, ...)
    chart: ["#7ff0d8", "#9b8cf5", "#e5c76b", "#f08fb7", "#ff6b6b"],
    // errors, warnings, "the run blew up", the destructive button
    destructive: "#ff6b6b",
  },

  light: {
    background: "#f4f6f8",
    card: "#ffffff",
    foreground: "#0c1016",
    "muted-foreground": "#5c6572",
    border: "#dde2e8",
    primary: "#0f8f74",
    secondary: "#6a5bd6",
    chart: ["#0f8f74", "#6a5bd6", "#b8901f", "#c9528a", "#d6453f"],
    destructive: "#d6453f",
  },
});
