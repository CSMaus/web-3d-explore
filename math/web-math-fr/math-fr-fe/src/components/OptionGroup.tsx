import type { ReactNode } from "react";
import { Text } from "@kit/index";

/**
 * one group of options or settings on a play page: a small heading, one sentence saying what each
 * choice does and why anyone would press it, then the choices. groups are divided by a rule so two
 * of them never read as one.
 */
export function OptionGroup({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className="space-y-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <Text kind="caption" as="p">{title}</Text>
      {note ? <Text kind="note" as="p">{note}</Text> : null}
      {children}
    </div>
  );
}
