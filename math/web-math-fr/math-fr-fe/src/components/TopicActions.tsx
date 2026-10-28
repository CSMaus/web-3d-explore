import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { NextButton } from "@/components/NextButton";
import { useTopicDrawer } from "@/lib/topicDrawer";

export const TOPIC_MENU_BUTTON = "topic-menu-button";

/**
 * a topic's own controls on a narrow screen, outside the top bar: a small tab on the left edge of
 * the screen with an arrow that slides the topic's side menu out (>) and back (<), and the next
 * page under the bar in the top right corner. a wide screen has the side menu in its own column.
 */
export function TopicActions() {
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const at = useTopicDrawer((s) => s.at);
  const setAt = useTopicDrawer((s) => s.setAt);
  const open = at === path;
  return (
    <>
      <button
        type="button"
        id={TOPIC_MENU_BUTTON}
        data-slot="rail-handle"
        data-open={open ? "true" : "false"}
        aria-expanded={open}
        aria-controls="topic-drawer"
        aria-label={open ? t("nav.closeMenu") : t("nav.menu")}
        onClick={() => setAt(open ? null : path)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {open ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
        </svg>
      </button>
      <div data-slot="next-float">
        <NextButton />
      </div>
    </>
  );
}
