import { create } from "zustand";

/**
 * the topic's menu drawer on a narrow screen, shared between its button in the top bar and the
 * drawer in the topic's frame: open on the page it was opened on, so moving to another page closes it.
 */
export const useTopicDrawer = create<{ at: string | null; setAt: (at: string | null) => void }>((set) => ({
  at: null,
  setAt: (at) => set({ at }),
}));
