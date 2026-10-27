import { Link } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button, Label, TextLink } from "@kit/index";
import { paletteOf } from "@/lib/palettes";
import { CONTOUR_LIGHT, FRONT_LIGHT_SET, FRONT_PALETTE } from "@/lib/site";

const Bulb = lazy(() => import("@/components/Bulb").then((m) => ({ default: m.Bulb })));

type View = "solid" | "contour";

/**
 * the first screen of the front page as one scene, read from Revolut's own page: the
 * words centred at the top, the title in two tones, one filled button and one link;
 * under them the Mandelbulb the full width of the screen, rising from below, its lower
 * part cut by the screen's edge. as the page scrolls the words lift and fade and the
 * Mandelbulb grows to its full size, so the picture carries on from the first screen
 * instead of ending with it. the switch between the solid and the contour light sits
 * under it with the way to its page. a reader who asks for less motion gets the scene
 * still.
 */
export function FrontScene() {
  const { t } = useTranslation();
  // the bulb is shown with its contour light only
  const view: View = "contour";
  const palette = paletteOf(FRONT_PALETTE);
  const host = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    let frame = 0;
    const set = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.8)));
      el.style.setProperty("--p", p.toFixed(3));
    };
    const ask = () => {
      if (!frame) frame = requestAnimationFrame(set);
    };
    set();
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
    };
  }, []);

  return (
    <section ref={host} data-slot="front-scene">
      <div data-slot="scene-words">
        <div data-slot="hero-eyebrow">
          <Label as="div">{t("front.eyebrow")}</Label>
        </div>
        <h1 data-slot="display">
          <span className="block">{t("front.title1")}</span>
          <span className="block">{t("front.title2")}</span>
        </h1>
        <p data-slot="lede">{t("front.lede")}</p>
        <div data-slot="hero-actions" className="flex flex-wrap items-center justify-center gap-6">
          <Button asChild>
            <Link to="/topics/fractals/parts">{t("front.start")}</Link>
          </Button>
          <TextLink asChild>
            <Link to="/topics">{t("front.browse")}</Link>
          </TextLink>
        </div>
      </div>
      <div data-slot="scene-picture">
        <Suspense fallback={<div className="absolute inset-0" />}>
          <Bulb className="absolute inset-0 h-full w-full" view={view} palette={palette} light={CONTOUR_LIGHT} {...FRONT_LIGHT_SET} />
        </Suspense>
      </div>
      <div data-slot="scene-foot">
        <TextLink asChild>
          <Link to="/topics/fractals/play/mandelbulb">{t("front.open")} ↗</Link>
        </TextLink>
      </div>
    </section>
  );
}
