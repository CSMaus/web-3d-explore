import type { ReactNode } from "react";

/** what a picture shows, said under it and never drawn over it. */
export function Caption({ children }: { children: ReactNode }) {
  return <p className="px-1 pt-1 font-mono text-[11px] leading-relaxed text-muted">{children}</p>;
}
