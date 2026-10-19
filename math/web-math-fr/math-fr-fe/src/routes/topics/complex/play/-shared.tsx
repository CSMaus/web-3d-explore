import type { ReactNode } from "react";
import { TabLink } from "@/components/TabLink";
import { SYSTEMS } from "@/lib/complex";

/** the frame every page of the opening topic sits in: the topic bar and the six tabs. */
export function ComplexFrame({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav className="mt-4 flex flex-wrap gap-1.5" aria-label="Pages of the topic">
        <TabLink to="/topics/complex/play" activeOptions={{ exact: true }}>
          All
        </TabLink>
        {SYSTEMS.map((s) => (
          <TabLink key={s.to} to={s.to}>
            {s.label}
          </TabLink>
        ))}
      </nav>
      {children}
    </div>
  );
}
