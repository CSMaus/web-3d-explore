import { Link } from "@tanstack/react-router";
import { GROUPS, SYSTEMS } from "@/lib/networks";

const CHIP =
  "rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-muted";

/**
 * thirteen pages is too many for one flat row, so the tabs are grouped by what
 * part of the subject they belong to and the group is named beside them.
 */
export function NetTabs() {
  return (
    <div className="space-y-1.5">
      <nav className="flex flex-wrap items-center gap-1.5">
        <Link
          to="/topics/networks/play"
          activeOptions={{ exact: true }}
          className={CHIP}
          activeProps={{ className: "border-leaf text-leaf" }}
        >
          All
        </Link>
      </nav>
      {GROUPS.map((group) => (
        <nav key={group} className="flex flex-wrap items-baseline gap-1.5">
          <span className="w-[110px] shrink-0 font-mono text-[10px] uppercase tracking-wider text-edge">
            {group}
          </span>
          {SYSTEMS.filter((s) => s.group === group).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={CHIP}
              activeProps={{ className: "border-leaf text-leaf" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ))}
    </div>
  );
}
