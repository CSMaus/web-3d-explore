import { create } from "zustand";

/** whether the search box is open, shared between the bar's button and the box itself. */
export const useSearchBox = create<{ open: boolean; setOpen: (v: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
