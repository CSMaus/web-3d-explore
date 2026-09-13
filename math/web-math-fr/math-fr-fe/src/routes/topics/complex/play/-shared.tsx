import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { TopicBar } from "@/components/TopicBar";
import { COMPLEX, SYSTEMS } from "@/lib/complex";

const CHIP = "rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-muted";

/** the frame every page of the opening topic sits in: the topic bar and the six tabs. */
export function ComplexFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={COMPLEX} />
      <nav className="mt-4 flex flex-wrap gap-1.5">
        <Link to="/topics/complex/play" activeOptions={{ exact: true }} className={CHIP} activeProps={{ className: "border-leaf text-leaf" }}>
          All
        </Link>
        {SYSTEMS.map((s) => (
          <Link key={s.to} to={s.to} className={CHIP} activeProps={{ className: "border-leaf text-leaf" }}>
            {s.label}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
