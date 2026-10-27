import own from "./palettes.own.json";

export type Palette = {
  id: string;
  name: string;
  back: string;
  ink: string;
  roles: string[];
  ramp: string[];
};

/** the palettes written in code, then the ones the owner composed in the picker (palettes.own.json, written by the dev server) */
const BUILT_IN: Palette[] = [
  // the front page's bulb in the Warm theme: the owner's "Own 2" from the picker, fixed here on
  // 2026-10-26 so a new save in the picker does not change it
  {
    id: "warm",
    name: "Warm",
    back: "#e0edd4",
    ink: "#eafff8",
    roles: ["#f19c00", "#da825a", "#ca892e", "#af0000"],
    ramp: ["#652d0c", "#ca892e", "#f19c00", "#da825a", "#af0000"],
  },
  // the front page's bulb in the Pixel theme: the owner's "Own 1" of 2026-10-26, fixed the same way
  {
    id: "pixel",
    name: "Pixel",
    back: "#03100f",
    ink: "#eafff8",
    roles: ["#fb7979", "#b17272", "#8c5a60", "#f0a8c1"],
    ramp: ["#06121f", "#8c5a60", "#fb7979", "#b17272", "#f0a8c1"],
  },
  {
    id: "ice",
    name: "Crystal ice",
    back: "#04080f",
    ink: "#eafcff",
    roles: ["#8fe0f5", "#2e97c9", "#f2feff", "#b49be8"],
    ramp: ["#061a30", "#0f4c80", "#2e97c9", "#8fe0f5", "#f2feff"],
  },
  {
    id: "leaf",
    name: "Leaf",
    back: "#080a0d",
    ink: "#e8e8ea",
    roles: ["#a5e3a0", "#8fd3e8", "#b49be8", "#c75ab0"],
    ramp: ["#1e1440", "#4a2a8c", "#8a3ab8", "#c75ab0", "#f0bee0"],
  },
  {
    id: "orchid",
    name: "Orchid",
    back: "#0b070f",
    ink: "#f2e8f5",
    roles: ["#b49be8", "#c75ab0", "#8fd3e8", "#f0bee0"],
    ramp: ["#160b2b", "#45197a", "#8a2fa8", "#cf5ba8", "#f6d4e8"],
  },
  {
    id: "moss",
    name: "Moss",
    back: "#070b08",
    ink: "#e9f2e8",
    roles: ["#4eb75c", "#37d152", "#002a0a", "#ecf7cf"],
    ramp: ["#0a1a12", "#002a0a", "#4eb75c", "#37d152", "#ecf7cf"],
  },
  {
    id: "spectrum",
    name: "Spectrum",
    back: "#050510",
    ink: "#f4f0ff",
    roles: ["#3fd48a", "#12a8c8", "#7a4ce0", "#f0a8d8"],
    ramp: ["#2b0a3d", "#1d3fb0", "#12a8c8", "#3fd48a", "#f0a8d8"],
  },
  {
    id: "aurora",
    name: "Aurora",
    back: "#03100f",
    ink: "#eafff8",
    roles: ["#22c07a", "#7fe8d0", "#c9a8f0", "#4aa8e0"],
    ramp: ["#06121f", "#0f5c4a", "#22c07a", "#7fe8d0", "#c9a8f0"],
  },
  {
    id: "neon",
    name: "Neon",
    back: "#07030f",
    ink: "#f6eaff",
    roles: ["#c221d8", "#3fd8f0", "#5a12b8", "#eafcff"],
    ramp: ["#10032b", "#5a12b8", "#c221d8", "#3fd8f0", "#eafcff"],
  },
  {
    id: "paper",
    name: "Paper",
    back: "#f4f1ea",
    ink: "#1b1b1f",
    roles: ["#2f6f4f", "#2b5f8a", "#6b3f8a", "#a03a6b"],
    ramp: ["#f4f1ea", "#cbd8c9", "#8fb0a0", "#4f7a72", "#1b3b3a"],
  },
];

export const PALETTES: Palette[] = [...BUILT_IN, ...(own as Palette[])];

export function paletteOf(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
