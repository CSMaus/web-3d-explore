import { TabLink } from "@/components/TabLink";
import { SYSTEMS } from "@/lib/chaos";

export function ChaosTabs() {
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Pages of the topic">
      <TabLink
        to="/topics/chaos/play"
        activeOptions={{ exact: true }}
      >
        All
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
