import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en/common.json";
import { LANGUAGES, LANGUAGE_KEY } from "@/lib/site";

/**
 * the message catalogue. the interface reads every one of its strings through
 * it, so a second language is a second json file: copy src/locales/en, translate,
 * import it here, and add the language to LANGUAGES in lib/site.ts.
 */
const resources = { en: { common: en } } as const;

function remembered(): string | undefined {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {
    // storage may be unavailable; the browser's language decides
  }
  const wanted = typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "en";
  return LANGUAGES.some((l) => l.code === wanted) ? wanted : undefined;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: remembered() ?? "en",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

/** the page declares its language, for screen readers and hyphenation. */
function declare(code: string) {
  if (typeof document !== "undefined") document.documentElement.lang = code;
}

declare(i18n.language);
i18n.on("languageChanged", (code) => {
  declare(code);
  try {
    window.localStorage.setItem(LANGUAGE_KEY, code);
  } catch {
    // a browser that refuses storage still gets the language for this visit
  }
});

export default i18n;
