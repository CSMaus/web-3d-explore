import { create } from "zustand";
import { PALETTES, type Palette } from "@/lib/palettes";

type Look = {
  palette: Palette;
  setPalette: (id: string) => void;
};

export const useLook = create<Look>((set) => ({
  palette: PALETTES[0],
  setPalette: (id) =>
    set({ palette: PALETTES.find((p) => p.id === id) ?? PALETTES[0] }),
}));
