import { TabLink } from "@/components/TabLink";
import { SYSTEMS } from "@/lib/systems";

export function PlayTabs() {
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Pages of the topic">
      <TabLink
        to="/topics/fractals/play"
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
