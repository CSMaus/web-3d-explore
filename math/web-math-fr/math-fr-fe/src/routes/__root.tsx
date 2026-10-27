import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FractalBackground, Heading, KIT_CASE, Kitten, kitTheme, Page, SkipLink, useMode } from "@kit/index";
import { BackToTop } from "@/components/BackToTop";
import { Consent } from "@/components/Consent";
import { NextButton } from "@/components/NextButton";
import { Menu } from "@/components/Menu";
import { Offline } from "@/components/Offline";
import { SearchBox } from "@/components/Search";
import { L } from "@/lib/lang";
import { BRAND, KITTEN_CASES } from "@/lib/site";
import { useLook } from "@/lib/store";

export const Route = createRootRoute({
  component: Shell,
  errorComponent: Broke,
});

function Broke({ error }: { error: unknown }) {
  return (
    <div className="min-h-full">
      <Menu />
      <Page className="pb-24">
        <Heading level={1} data-tone="destructive">{L("This page did not load")}</Heading>
        <div className="mt-6">
          <Offline title={L("Something went wrong on this page")} what={error instanceof Error ? error.message : L("The reason was not reported")} />
        </div>
      </Page>
    </div>
  );
}

function Shell() {
  const { t } = useTranslation();
  const mode = useMode(kitTheme.colours.default);
  const shell = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    document.title = BRAND;
  }, []);
  // the plots' palette follows the light or dark page until the reader picks one
  useEffect(() => {
    useLook.getState().follow(mode);
  }, [mode]);
  // data-scrolling on html while the page scrolls and for a moment after, so the sheet can hold
  // still what is costly to paint (the fractal's wave) and scrolling stays smooth
  useEffect(() => {
    const root = document.documentElement;
    let rest = 0;
    const onScroll = () => {
      if (!rest) root.setAttribute("data-scrolling", "");
      clearTimeout(rest);
      rest = window.setTimeout(() => {
        rest = 0;
        root.removeAttribute("data-scrolling");
      }, 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(rest);
      root.removeAttribute("data-scrolling");
    };
  }, []);
  return (
    <>
      <FractalBackground settings={kitTheme.fractal} of={shell} />
      {/* the pixel case's two kittens, on every page: one asleep on the right, one playing on the left */}
      {KITTEN_CASES.includes(KIT_CASE) ? (
        <>
          <Kitten kind="sleeping" />
          <Kitten kind="playing" />
        </>
      ) : null}
      <div ref={shell} className="relative z-[1] min-h-full">
      <SkipLink>{t("nav.skip")}</SkipLink>
      <Menu />
      <NextButton />
      <div id="content" tabIndex={-1} className="outline-none">
        <Outlet />
      </div>
      <SearchBox />
      <BackToTop />
      <Consent />
      </div>
    </>
  );
}
