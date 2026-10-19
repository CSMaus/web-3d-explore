import { create } from "zustand";

/**
 * the index of a long page (the mathematics page, the series), handed to the
 * rail beside the topic so there is one menu and not two. the page sets the
 * items and which one is under the bar; the rail shows them under the open
 * section and sends a click back through `go`.
 */
export type IndexItem = { id: string; label: string; accent?: string };

type RailIndex = {
  items: IndexItem[];
  here: string;
  go: (id: string) => void;
  set: (items: IndexItem[], here: string, go: (id: string) => void) => void;
  clear: () => void;
};

export const useRailIndex = create<RailIndex>((set) => ({
  items: [],
  here: "",
  go: () => undefined,
  set: (items, here, go) => set({ items, here, go }),
  clear: () => set({ items: [], here: "", go: () => undefined }),
}));
