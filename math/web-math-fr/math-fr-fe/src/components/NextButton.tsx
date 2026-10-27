import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@kit/index";
import { L } from "@/lib/lang";
import { nextAfter } from "@/lib/sequence";

/**
 * the next page of a topic, for the topic bar on phones and narrow screens: it goes to the next
 * page of a topic, and from the last page of a topic to the next topic, so a reader goes on without
 * opening the menu. it sits in the bar, never over the page. off the topics it is not shown.
 */
export function NextButton() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const next = nextAfter(path);
  if (!next) return null;
  return (
    <Button size="sm" variant="outline" asChild>
      <Link data-slot="next-button" to={next.to} aria-label={L("Next: {{page}}", { page: next.label })} title={next.label} className="shrink-0">
        {L("Next")} →
      </Link>
    </Button>
  );
}
