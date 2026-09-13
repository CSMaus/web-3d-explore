import { Link, type LinkProps } from "@tanstack/react-router";

const CHIP =
  "rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-muted";

type Item = { readonly to: LinkProps["to"]; readonly label: string; readonly group: string };

/**
 * a tab row grouped by the part of the subject each page belongs to, with an
 * "all" chip first. the same component serves any topic with more pages than
 * one flat row can hold.
 */
export function GroupTabs({ all, groups, items }: { all: LinkProps["to"]; groups: readonly string[]; items: readonly Item[] }) {
  return (
    <div className="space-y-1.5">
      <nav className="flex flex-wrap items-center gap-1.5">
        <Link to={all} activeOptions={{ exact: true }} className={CHIP} activeProps={{ className: "border-leaf text-leaf" }}>
          All
        </Link>
      </nav>
      {groups.map((group) => (
        <nav key={group} className="flex flex-wrap items-baseline gap-1.5">
          <span className="w-[150px] shrink-0 font-mono text-[10px] uppercase tracking-wider text-edge">{group}</span>
          {items
            .filter((s) => s.group === group)
            .map((item) => (
              <Link key={item.to} to={item.to} className={CHIP} activeProps={{ className: "border-leaf text-leaf" }}>
                {item.label}
              </Link>
            ))}
        </nav>
      ))}
    </div>
  );
}
