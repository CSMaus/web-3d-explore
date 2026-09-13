import type { ReactNode } from "react";
import { GroupTabs } from "@/components/GroupTabs";
import { TopicBar } from "@/components/TopicBar";
import { GROUPS, SYSTEMS, TOKENS } from "@/lib/tokens";

/** the frame every topic 4 play page sits in. */
export function TokenFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={TOKENS} />
      <div className="mt-4">
        <GroupTabs all="/topics/tokens/play" groups={GROUPS} items={SYSTEMS} />
      </div>
      {children}
    </main>
  );
}

export const BTN = "rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-muted";
export const BTN_ON = "rounded border border-leaf px-2.5 py-1 font-mono text-[11px] text-leaf";
export const FIELD = "mt-1 w-full rounded border border-edge bg-transparent px-2 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-leaf";
