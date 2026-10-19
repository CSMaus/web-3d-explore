import type { ReactNode } from "react";

/** the frame every topic 4 play page sits in; the navigation is the topic's rail, so this is the page alone. */
export function TokenFrame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
