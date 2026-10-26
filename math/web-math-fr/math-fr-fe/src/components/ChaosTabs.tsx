import { TabLink } from "@/components/TabLink";
import { SYSTEMS } from "@/lib/chaos";
import { L } from "@/lib/lang";

export function ChaosTabs() {
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label={L("Pages of the topic")}>
      <TabLink
        to="/topics/chaos/play"
        activeOptions={{ exact: true }}
      >
        {L("All")}
      </TabLink>
      {SYSTEMS.map((item) => (
        <TabLink
          key={item.to}
          to={item.to}
        >
          {item.label}
        </TabLink>
      ))}
    </nav>
  );
}
