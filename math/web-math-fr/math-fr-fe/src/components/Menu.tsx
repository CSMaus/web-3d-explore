import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Brand, BrandInner, Button, CASE_SELECT_SHOWN, caseLabels, CaseSwitch, KIT_CASE, KIT_CASES, kitTheme, LanguageSwitch, ModeSwitch, pickCase, SearchButton, TopBar, TopBarDivider, TopBarLink, useModeChoice } from "@kit/index";
import { useSearchBox } from "@/lib/searchBox";
import { HAS_BACKEND } from "@/lib/api";
import { BRAND, DONATE_URL, LANGUAGES } from "@/lib/site";

type To = "/learn" | "/topics" | "/play" | "/about" | "/projects" | "/contact" | "/kit";
type Item = { to: To; key: string };

const LEFT: Item[] = [
  { to: "/learn", key: "nav.learn" },
  { to: "/topics", key: "nav.topics" },
  { to: "/play", key: "nav.play" },
];
const RIGHT: Item[] = [
  { to: "/about", key: "nav.about" },
  { to: "/projects", key: "nav.projects" },
  { to: "/contact", key: "nav.contact" },
  // the kit preview is a development tool and the link exists only there
  ...(import.meta.env.DEV ? [{ to: "/kit", key: "nav.kit" } as Item] : []),
];

const MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const CASES = caseLabels(KIT_CASES);

export function Menu() {
  const { t, i18n } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const setOpen = useSearchBox((s) => s.setOpen);
  const [mode, pickMode] = useModeChoice(kitTheme.colours.default);
  const link = (item: Item) => (
    <TopBarLink key={item.to} active={path.startsWith(item.to)} asChild>
      <Link to={item.to}>{t(item.key)}</Link>
    </TopBarLink>
  );

  return (
    <TopBar
      brand={
        <Brand asChild>
          <Link to="/" aria-label={BRAND}>
            <BrandInner>{BRAND}</BrandInner>
          </Link>
        </Brand>
      }
      actions={
        <>
          <SearchButton label={t("nav.search")} shortcut={MAC ? "⌘K" : "Ctrl K"} onClick={() => setOpen(true)} />
          <ModeSwitch mode={mode} onChange={pickMode} labels={{ light: t("nav.light"), dark: t("nav.dark") }} />
          {CASE_SELECT_SHOWN ? <CaseSwitch value={KIT_CASE} names={CASES} onChange={(c) => void pickCase(c)} label={t("nav.theme")} /> : null}
          {LANGUAGES.length > 1 ? (
            <LanguageSwitch value={i18n.language} options={LANGUAGES} onChange={(code) => void i18n.changeLanguage(code)} label={t("nav.language")} />
          ) : null}
          {HAS_BACKEND ? (
            <Button variant="ghost" asChild>
              <Link to="/account">{t("nav.login")}</Link>
            </Button>
          ) : null}
          {DONATE_URL ? (
            <Button asChild>
              <a href={DONATE_URL} target="_blank" rel="noreferrer">
                {t("nav.donate")}
              </a>
            </Button>
          ) : null}
        </>
      }
    >
      {LEFT.map(link)}
      <TopBarDivider />
      {RIGHT.map(link)}
    </TopBar>
  );
}
