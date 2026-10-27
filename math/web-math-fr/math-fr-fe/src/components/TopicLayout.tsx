import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@kit/index";
import { NextButton } from "@/components/NextButton";
import { TopicHead } from "@/components/TopicHead";
import { TopicRail } from "@/components/TopicRail";
import type { BuiltTopic } from "@/lib/topic";

const RAIL_ID = "topic-rail";
const DRAWER_ID = "topic-drawer";
/** the reader's choice to keep the side menu shown or hidden, in the browser */
const SHOWN_KEY = "mathfr_rail_shown";

function readShown(): boolean {
  try {
    return localStorage.getItem(SHOWN_KEY) !== "hidden";
  } catch {
    return true;
  }
}

function saveShown(shown: boolean): void {
  try {
    localStorage.setItem(SHOWN_KEY, shown ? "shown" : "hidden");
  } catch {
    return;
  }
}

/**
 * the frame of every page inside a topic. on a wide screen the side menu sits
 * in its own column on the left and can be hidden and shown with one button,
 * and the choice is kept in the browser. on a narrow screen the same menu is a
 * drawer over the page, opened by a button above the page, closed by its own
 * button, the backdrop, Escape, or moving to another page; focus goes into the
 * drawer when it opens and back to the button when it closes, and the page
 * behind it does not scroll. on a narrow screen a half-transparent bar stays
 * under the top bar: the topic's sections to tap, the menu button for every
 * page, and the next page at its right end.
 */
export function TopicLayout({ topic }: { topic: BuiltTopic }) {
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [shown, setShown] = useState(readShown);
  const [drawerAt, setDrawerAt] = useState<string | null>(null);
  const drawer = drawerAt === path;
  const opener = useRef<HTMLButtonElement | null>(null);
  const closer = useRef<HTMLButtonElement | null>(null);

  const toggleShown = () => {
    setShown((s) => {
      saveShown(!s);
      return !s;
    });
  };

  useEffect(() => {
    if (!drawer) return;
    const back = opener.current;
    closer.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerAt(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      back?.focus();
    };
  }, [drawer]);

  return (
    <Page className={shown ? "lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12" : ""}>
      <aside id={RAIL_ID} className={shown ? "hidden lg:block" : "hidden"}>
        <div data-slot="side-nav-head">
          <button type="button" data-slot="side-nav-toggle" data-text="tab" aria-expanded="true" aria-controls={RAIL_ID} className="inline-flex items-center gap-2" onClick={toggleShown}>
            {t("nav.hideMenu")}
          </button>
        </div>
        <TopicRail topic={topic} />
      </aside>

      <div className="min-w-0">
        <div data-slot="side-nav-bar">
          {shown ? null : (
            <button type="button" data-slot="side-nav-toggle" data-text="tab" aria-expanded="false" aria-controls={RAIL_ID} className="hidden items-center gap-2 lg:inline-flex" onClick={toggleShown}>
              {t("nav.showMenu")}
            </button>
          )}
        </div>
        {/* the topic bar of a narrow screen, held under the top bar */}
        <div
          data-slot="topic-bar"
          className="sticky top-[var(--topbar-height)] z-30 -mx-4 mb-4 flex items-center gap-2 px-4 py-2 lg:hidden"
        >
          <button ref={opener} type="button" data-slot="side-nav-toggle" data-text="tab" aria-expanded={drawer} aria-controls={DRAWER_ID} className="inline-flex shrink-0 items-center gap-2" onClick={() => setDrawerAt(drawer ? null : path)}>
            {t("nav.menu")}
          </button>
          <nav aria-label={topic.title} className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {topic.sections.map((s) => {
              const on = path === s.to || path.startsWith(`${s.to}/`);
              return (
                <Link key={s.to} to={s.to} data-slot="topic-bar-link" data-text="tab" data-active={on ? "true" : "false"} aria-current={on ? "page" : undefined} className="shrink-0">
                  {s.label}
                </Link>
              );
            })}
          </nav>
          <NextButton />
        </div>
        {topic.sections.some((s) => s.to === path.replace(/\/$/, "")) ? <TopicHead topic={topic} /> : null}
        <Outlet />
      </div>

      {drawer ? (
        <div id={DRAWER_ID} role="dialog" aria-modal="true" aria-label={t("nav.menu")} className="fixed inset-0 z-[60] lg:hidden">
          <button type="button" aria-label={t("nav.closeMenu")} className="absolute inset-0 bg-foreground/40" onClick={() => setDrawerAt(null)} />
          <div data-slot="side-nav-drawer" className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] overflow-y-auto bg-card p-6 shadow-2xl">
            <div data-slot="side-nav-head">
              <button ref={closer} type="button" data-slot="side-nav-toggle" data-text="tab" className="inline-flex items-center gap-2" onClick={() => setDrawerAt(null)}>
                {t("nav.closeMenu")}
              </button>
            </div>
            <TopicRail topic={topic} />
          </div>
        </div>
      ) : null}
    </Page>
  );
}
