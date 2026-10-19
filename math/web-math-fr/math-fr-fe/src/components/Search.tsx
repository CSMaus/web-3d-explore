import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, Input, Label } from "@kit/index";
import { api, type Card } from "@/lib/api";
import { search, withCards, type Hit } from "@/lib/search";
import { useSearchBox } from "@/lib/searchBox";

/** the results for a query, as a list a page or the box can show. */
export function Results({ hits, active, onPick }: { hits: Hit[]; active?: number; onPick?: () => void }) {
  return (
    <ul role="listbox" className="divide-y divide-edge">
      {hits.map((h, i) => (
        <li key={h.to + h.title} role="option" aria-selected={i === active}>
          <Link
            to={h.to}
            onClick={onPick}
            className={i === active ? "block rounded px-3 py-2 bg-selected/10" : "block rounded px-3 py-2 hover:bg-foreground/5"}
          >
            <span data-text="body">{h.title}</span>
            <span data-text="caption" className="ml-3">{h.place}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * search over the whole site, opened from the bar or with the key. the index
 * is built in the browser; the backend's summaries are folded in when it
 * answers and nothing waits for it.
 */
export function SearchBox() {
  const { t } = useTranslation();
  const { open, setOpen } = useSearchBox();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [cards, setCards] = useState<Card[] | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    let alive = true;
    api.topics().then((list) => {
      if (alive && list) setCards(list);
    });
    return () => {
      alive = false;
    };
  }, [open]);

  const entries = useMemo(() => withCards(cards), [cards]);
  const hits = useMemo(() => search(query, entries), [query, entries]);

  if (!open) return null;

  const pick = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("search.heading")}
        className="mx-auto mt-24 w-[min(640px,calc(100%-32px))] rounded border border-border bg-card p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Label as="div">{t("search.heading")}</Label>
        <div className="mt-3">
          <Input
            ref={input}
            value={query}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(hits.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter" && hits[active]) {
                pick();
                void navigate({ to: hits[active].to });
              }
            }}
          />
        </div>
        <Text kind="caption" as="p" className="mt-2">{t("search.hint")}</Text>
        <div className="mt-3 max-h-[50vh] overflow-y-auto">
          {query && hits.length === 0 ? <Text kind="intro" as="p" className="px-3 py-2">{t("search.empty")}</Text> : null}
          {hits.length > 0 ? (
            <>
              <Text kind="caption" as="p" className="px-3 pb-1">{t("search.results", { count: hits.length })}</Text>
              <Results hits={hits} active={active} onPick={pick} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
