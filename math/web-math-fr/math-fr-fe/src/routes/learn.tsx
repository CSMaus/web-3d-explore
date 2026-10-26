import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Band, Badge, Button, Choices, Heading, Hero, Page, SolidFigure, Text } from "@kit/index";
import { api } from "@/lib/api";
import { SHAPES, topicLabel } from "@/lib/shapes";
import { BUILT } from "@/lib/topic";

const TOPICS = Object.values(BUILT)
  .filter((b) => b.slug !== "primes")
  .sort((a, b) => a.number - b.number);

export const Route = createFileRoute("/learn")({
  loader: async () => {
    const [cards, series] = await Promise.all([api.topics(), Promise.all(TOPICS.map((b) => api.topic(b.slug)))]);
    return { cards, series };
  },
  component: Learn,
});

/**
 * the series of every topic, in reading order. a row of chips picks the topic; the
 * band under it shows that topic's turning figure, what the series is, and its parts
 * in order, each a way into the series at that part.
 */
function Learn() {
  const { t } = useTranslation();
  const { cards, series } = Route.useLoaderData();
  const [slug, setSlug] = useState<string>(TOPICS[0].slug);
  const at = Math.max(0, TOPICS.findIndex((b) => b.slug === slug));
  const topic = TOPICS[at];
  const card = cards?.find((c) => c.slug === topic.slug);
  const parts = series[at]?.part_list ?? [];
  const into = topic.sections.find((s) => s.label === "Parts");
  const shape = SHAPES[topic.slug];

  return (
    <Page className="pb-0">
      <Hero size="page" title={t("learn.heading")} lede={t("learn.lede")} />
      <Choices options={TOPICS.map((b) => ({ id: b.slug, label: topicLabel(b.number, t) }))} value={topic.slug} onPick={setSlug} />
      <Band tone="card" className="mt-8" aria-live="polite">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:gap-16">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span data-text="label">{topicLabel(topic.number, t)}</span>
              {card ? <Badge variant="outline">{t(`state.${card.state}`)}</Badge> : null}
            </div>
            <Heading level={2} className="mt-3">{topic.title}</Heading>
            <Text kind="intro" as="p" className="mt-4 max-w-xl">{card?.summary || t(`front.lines.${topic.slug}`)}</Text>
            {card ? (
              <Text kind="caption" as="p" className="mt-4">
                {card.parts > 0 ? `${card.parts} parts, ${card.beats} beats, about ${Math.round(card.seconds / 60)} minutes` : "No clip filmed yet"}
              </Text>
            ) : null}
            {into ? (
              <div className="mt-8">
                <Button asChild>
                  <Link to={into.to}>{t("learn.open")}</Link>
                </Button>
              </div>
            ) : null}
          </div>
          <div className="mx-auto aspect-square w-full max-w-[360px]">{shape ? <SolidFigure key={topic.slug} kind={shape} className="h-full w-full" /> : null}</div>
        </div>
        {into && parts.length > 0 ? (
          <ol className="mt-14 grid gap-x-10 border-t border-border md:grid-cols-2">
            {parts.map((part) => (
              <li key={part.number} className="border-b border-border">
                <Link to={into.to} hash={`part-${part.number}`} className="group flex items-baseline gap-5 py-5">
                  <span data-text="label" className="w-8 shrink-0 tabular-nums">{String(part.number).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div data-text="itemTitle" className="group-hover:text-selected">{part.title}</div>
                    {part.question ? <Text kind="note" as="div" className="mt-1">{part.question}</Text> : null}
                  </div>
                  <span aria-hidden="true" className="text-muted-foreground transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
      </Band>
    </Page>
  );
}
