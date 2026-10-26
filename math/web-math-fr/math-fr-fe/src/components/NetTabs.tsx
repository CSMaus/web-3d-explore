import { TabLink } from "@/components/TabLink";
import { GROUPS, SYSTEMS } from "@/lib/networks";
import { L } from "@/lib/lang";

/**
 * seventeen pages is too many for one flat row, so the tabs are grouped by what
 * part of the subject they belong to and the group is named beside them.
 */
export function NetTabs() {
  return (
    <nav className="space-y-1.5" aria-label={L("Pages of the topic")}>
      <div className="flex flex-wrap items-center gap-1.5">
        <TabLink
          to="/topics/networks/play"
          activeOptions={{ exact: true }}
        >
          {L("All")}
        </TabLink>
      </div>
      {GROUPS.map((group) => (
        <div key={group} className="flex flex-wrap items-baseline gap-1.5">
          <span data-text="label" className="w-[110px] shrink-0">
            {group}
          </span>
          {SYSTEMS.filter((s) => s.group === group).map((item) => (
            <TabLink
              key={item.to}
              to={item.to}
            >
              {item.label}
            </TabLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
