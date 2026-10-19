import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, Heading, Input, Page } from "@kit/index";
import { Results } from "@/components/Search";
import { api, type Card } from "@/lib/api";
import { search, withCards } from "@/lib/search";

export const Route = createFileRoute("/search")({
  validateSearch: (raw: Record<string, unknown>) => ({ q: typeof raw.q === "string" ? raw.q : "" }),
  component: SearchPage,
});

/** the search as a page of its own, for a link or a browser without the key. */
function SearchPage() {
  const { t } = useTranslation();
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q);
  const [cards, setCards] = useState<Card[] | null>(null);
  useEffect(() => {
    let alive = true;
    api.topics().then((list) => {
      if (alive && list) setCards(list);
    });
    return () => {
      alive = false;
    };
  }, []);
  const hits = useMemo(() => search(query, withCards(cards), 40), [query, cards]);
  return (
    <Page>
      <Heading>{t("search.heading")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">{t("search.hint")}</Text>
      <div className="mt-6 max-w-xl">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search.placeholder")} aria-label={t("search.placeholder")} />
      </div>
      <div className="mt-6 max-w-xl">
        {query && hits.length === 0 ? <Text kind="intro" as="p">{t("search.empty")}</Text> : null}
        {hits.length > 0 ? <Results hits={hits} /> : null}
      </div>
    </Page>
  );
}
