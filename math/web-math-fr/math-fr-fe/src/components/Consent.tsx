import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, Banner, Button } from "@kit/index";
import { HAS_BACKEND } from "@/lib/api";

const KEY = "mathfr_session_consent";

function readChoice(): string | null {
  const hit = document.cookie.split("; ").find((part) => part.startsWith(`${KEY}=`));
  return hit ? decodeURIComponent(hit.split("=")[1]) : null;
}

function writeChoice(value: string) {
  const year = 60 * 60 * 24 * 365;
  document.cookie = `${KEY}=${value}; path=/; max-age=${year}; samesite=lax`;
}

export function Consent() {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<string | null>(() => readChoice());

  // the notice is about the backend's session cookie and its record of requests; a site built to
  // run without the backend keeps neither, so it asks nothing
  if (!HAS_BACKEND || choice !== null) return null;

  const decide = (value: string) => {
    writeChoice(value);
    setChoice(value);
  };

  return (
    <Banner role="region" aria-label={t("consent.accept")} className="z-[60]">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
        <Text kind="note" as="p">{t("consent.text")}</Text>
        <div className="flex shrink-0 gap-2">
          <Button onClick={() => decide("accepted")}>{t("consent.accept")}</Button>
          <Button variant="outline" size="sm" onClick={() => decide("declined")}>
            {t("consent.decline")}
          </Button>
        </div>
      </div>
    </Banner>
  );
}
