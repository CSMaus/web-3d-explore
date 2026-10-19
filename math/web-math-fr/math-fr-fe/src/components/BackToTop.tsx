import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { kitTheme } from "@kit/index";

/** how far down any page is before the button appears, in px: set in the case's motion.ts */
const SHOW_AFTER = kitTheme.motion.top.after;

/** the window, or the front page's own scrolling stack of screens: whichever has moved */
function scrolled(): number {
  const inner = document.querySelector<HTMLElement>('[data-slot="screens"]');
  return Math.max(window.scrollY, inner?.scrollTop ?? 0);
}

/**
 * one button that takes the reader back to the top of the page, on every page,
 * shown once the page has moved down a little. it listens to every scroll in
 * the document, since the front page scrolls inside its own stack of screens
 * and not the window. it moves focus to the page's content so a keyboard
 * reader lands where the eye does; the scroll is instant when the reader has
 * asked for less motion.
 */
export function BackToTop() {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const look = () => setShown(scrolled() > SHOW_AFTER);
    look();
    document.addEventListener("scroll", look, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", look, { capture: true });
  }, []);
  const up = () => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = still ? "auto" : "smooth";
    window.scrollTo({ top: 0, behavior });
    document.querySelector<HTMLElement>('[data-slot="screens"]')?.scrollTo({ top: 0, behavior });
    document.getElementById("content")?.focus({ preventScroll: true });
  };
  return (
    <button type="button" data-slot="back-to-top" data-shown={shown} aria-label={t("nav.top")} title={t("nav.top")} onClick={up} tabIndex={shown ? 0 : -1}>
      <span aria-hidden="true" />
    </button>
  );
}
