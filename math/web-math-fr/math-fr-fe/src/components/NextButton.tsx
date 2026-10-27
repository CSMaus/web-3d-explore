import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@kit/index";
import { L } from "@/lib/lang";
import { nextAfter } from "@/lib/sequence";

/**
 * a small button in the top left corner on phones and narrow screens, there at any time: it goes
 * to the next page of a topic, and from the last page of a topic to the next topic, so a reader
 * goes on without opening the menu. wide screens have the side menu and do without it.
 */
export function NextButton() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const next = nextAfter(path);
  if (!next) return null;
  return (
    <div data-slot="next-button" style={{ background: "var(--c-background)", borderRadius: "var(--button-radius)" }} className="fixed left-[max(16px,env(safe-area-inset-left,0px))] top-[calc(var(--topbar-height)_+_10px)] z-40 lg:hidden">
      <Button size="sm" variant="outline" asChild>
        <Link to={next.to} aria-label={L("Next: {{page}}", { page: next.label })} title={next.label}>
          {L("Next")} →
        </Link>
      </Button>
    </div>
  );
}
