import { Link, useRouterState } from "@tanstack/react-router";
import { L } from "@/lib/lang";
import { nextAfter } from "@/lib/sequence";

/**
 * the next page of a topic, in the top bar of a narrow screen: the word with a line of light under
 * it. it goes to the next page of a topic, and from the last page of a topic to the next topic; off
 * the topics it is not shown. its name, with the page it leads to, is read out and shown on hover.
 */
export function NextButton() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const next = nextAfter(path);
  if (!next) return null;
  const name = L("Next: {{page}}", { page: next.label });
  return (
    <Link data-slot="next-button" data-text="nav" to={next.to} aria-label={name} title={name}>
      {L("Next")}
    </Link>
  );
}
