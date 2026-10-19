import type { LinkProps } from "@tanstack/react-router";
import { TabLink } from "@/components/TabLink";

type Item = { readonly to: LinkProps["to"]; readonly label: string; readonly group: string };

/**
 * a tab row grouped by the part of the subject each page belongs to, with an
 * "all" chip first. the same component serves any topic with more pages than
 * one flat row can hold.
 */
export function GroupTabs({ all, groups, items }: { all: LinkProps["to"]; groups: readonly string[]; items: readonly Item[] }) {
  return (
    <nav className="space-y-1.5" aria-label="Pages of the topic">
      <div className="flex flex-wrap items-center gap-1.5">
        <TabLink to={all} activeOptions={{ exact: true }}>
          All
        </TabLink>
      </div>
      {groups.map((group) => (
        <div key={group} className="flex flex-wrap items-baseline gap-1.5">
          <span data-text="label" className="w-[150px] shrink-0">{group}</span>
          {items
            .filter((s) => s.group === group)
            .map((item) => (
              <TabLink key={item.to} to={item.to}>
                {item.label}
              </TabLink>
            ))}
        </div>
      ))}
    </nav>
  );
}
