import { useEffect } from "react";
import { useRailIndex, type IndexItem } from "@/lib/railIndex";

type Props = { items: IndexItem[]; here: string; onPick: (id: string) => void };

/**
 * a long page's index, handed to the rail beside the topic. renders nothing of
 * its own: the rail lists the items under the open section, so the page has
 * one menu. the index is taken down when the page goes.
 */
export function RailIndex({ items, here, onPick }: Props) {
  const set = useRailIndex((s) => s.set);
  const clear = useRailIndex((s) => s.clear);
  useEffect(() => {
    set(items, here, onPick);
  }, [items, here, onPick, set]);
  useEffect(() => clear, [clear]);
  return null;
}
