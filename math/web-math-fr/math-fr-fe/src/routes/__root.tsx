import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Heading, kitTheme, SkipLink, useMode, Page } from "@kit/index";
import { BackToTop } from "@/components/BackToTop";
import { Consent } from "@/components/Consent";
import { Menu } from "@/components/Menu";
import { Offline } from "@/components/Offline";
import { SearchBox } from "@/components/Search";
import { BRAND } from "@/lib/site";
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
        <Heading level={1} data-tone="destructive">This page did not load</Heading>
        <div className="mt-6">
          <Offline what={error instanceof Error ? error.message : "The reason was not reported"} />
        </div>
      </Page>
    </div>
  );
}

function Shell() {
  const { t } = useTranslation();
  const mode = useMode(kitTheme.colours.default);
  useEffect(() => {
    document.title = BRAND;
  }, []);
  // the plots' palette follows the light or dark page until the reader picks one
  useEffect(() => {
    useLook.getState().follow(mode);
  }, [mode]);
  return (
    <div className="min-h-full">
      <SkipLink>{t("nav.skip")}</SkipLink>
      <Menu />
      <div id="content" tabIndex={-1} className="outline-none">
        <Outlet />
      </div>
      <SearchBox />
      <BackToTop />
      <Consent />
    </div>
  );
}
