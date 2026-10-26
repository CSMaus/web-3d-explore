import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Brand, BrandInner, Button, caseLabel, caseLight, chooseCase, KIT_CASE, kitTheme, LanguageSwitch, ModeSwitch, SearchButton, ThemeSwitch, TopBar, TopBarDivider, TopBarLink, useModeChoice } from "@kit/index";
import { ThemeSign } from "@/components/ThemeSign";
import { L } from "@/lib/lang";
import { useSearchBox } from "@/lib/searchBox";
import { HAS_BACKEND } from "@/lib/api";
import { BRAND, DONATE_URL, LANGUAGES, THEMES } from "@/lib/site";

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

export function Menu() {
  const { t, i18n } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const setOpen = useSearchBox((s) => s.setOpen);
  const [mode, pickMode] = useModeChoice(kitTheme.colours.default);
  // the themes of the switch, each in its own light for the mode in force; a case in the making
  // that config/case.ts names on the dev server is listed after them, under its folder name
  const themes = [
    ...THEMES.map((th) => ({ id: th.case, name: L(th.name), sign: <ThemeSign kind={th.sign} />, light: caseLight(th.case as typeof KIT_CASE, mode) })),
    ...(THEMES.some((th) => th.case === KIT_CASE) ? [] : [{ id: KIT_CASE, name: caseLabel(KIT_CASE), sign: null, light: caseLight(KIT_CASE, mode) }]),
  ];
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
          <ThemeSwitch value={KIT_CASE} options={themes} onChange={chooseCase} label={t("nav.theme")} />
          {LANGUAGES.length > 1 ? (
            <LanguageSwitch value={i18n.language} options={LANGUAGES} onChange={(code) => void i18n.changeLanguage(code).then(() => window.location.reload())} label={t("nav.language")} />
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
