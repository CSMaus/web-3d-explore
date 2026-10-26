import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Band, Choices, Heading, Hero, Page, SolidFigure } from "@kit/index";
import { PlayTile } from "@/components/PlayTile";
import { PrimesCard } from "@/components/PrimesCard";
import { L } from "@/lib/lang";
import { api } from "@/lib/api";
import { SYSTEMS as CHAOS_PAGES } from "@/lib/chaos";
import { SYSTEMS as COMPLEX_PAGES } from "@/lib/complex";
import { SYSTEMS as NETWORK_PAGES } from "@/lib/networks";
import { SYSTEMS as PRIMES_PAGES } from "@/lib/primes";
import { SHAPES, topicLabel } from "@/lib/shapes";
import { SYSTEMS as FRACTAL_PAGES } from "@/lib/systems";
import { SYSTEMS as TOKEN_PAGES } from "@/lib/tokens";
import { BUILT } from "@/lib/topic";

export const Route = createFileRoute("/play")({
  loader: async () => {
    const all = await Promise.all(TOPICS.map((b) => api.theory(b.slug)));
    return Object.fromEntries(TOPICS.map((b, i) => [b.slug, Object.fromEntries((all[i]?.systems ?? []).map((x) => [x.id, x.summary]))])) as Record<string, Record<string, string>>;
  },
  component: Play,
});

const PAGES = {
  complex: COMPLEX_PAGES,
  fractals: FRACTAL_PAGES,
  chaos: CHAOS_PAGES,
  networks: NETWORK_PAGES,
  tokens: TOKEN_PAGES,
  primes: PRIMES_PAGES,
} as const;

type PlayPage = { id: string; to: string; label: string; tex?: string; texSaid?: string };

const TOPICS = Object.values(BUILT).sort((a, b) => a.number - b.number);

const bandId = (slug: string) => `play-${slug}`;

/**
 * every interactive page on the site, by topic, in reading order: one band a topic,
 * its turning figure and name at the side, its pages as tiles. a row of chips held
 * under the bar marks the topic in view and moves to another.
 */
function Play() {
  const { t } = useTranslation();
  const summaries = Route.useLoaderData();
  const [here, setHere] = useState<string>(TOPICS[0].slug);

  useEffect(() => {
    const watch = new IntersectionObserver(
      (seen) => {
        const top = seen.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setHere(top.target.id.replace("play-", ""));
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const b of TOPICS) {
      const el = document.getElementById(bandId(b.slug));
      if (el) watch.observe(el);
    }
    return () => watch.disconnect();
  }, []);

  const go = (slug: string) => {
    setHere(slug);
    document.getElementById(bandId(slug))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Page className="pb-0">
      <Hero size="page" title={t("play.heading")} lede={t("play.lede")} />
      <div
        className="sticky top-[var(--topbar-height)] z-10 py-3"
        style={{ borderImage: "linear-gradient(color-mix(in oklab, var(--c-background) 92%, transparent) 0 0) fill 0 / / 0 100vmax" }}
      >
        <Choices
          options={TOPICS.map((b) => ({ id: b.slug, label: b.slug === "primes" ? L("Prime numbers") : topicLabel(b.number, t) }))}
          value={here}
          onPick={go}
        />
      </div>
      {TOPICS.map((topic, i) => {
        const pages = PAGES[topic.slug as keyof typeof PAGES] as readonly PlayPage[];
        const shape = SHAPES[topic.slug];
        return (
          <Band key={topic.slug} id={bandId(topic.slug)} tone={i % 2 === 0 ? "card" : "page"} className={i === 0 ? "mt-8" : ""} style={{ scrollMarginTop: "calc(var(--topbar-height) + 64px)" }}>
            {topic.slug === "primes" ? (
              <PrimesCard to={pages[0].to as never} />
            ) : (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-16">
              <div data-topic={topic.number}>
                {shape ? (
                  <div className="aspect-square w-full max-w-[200px] lg:max-w-[260px]">
                    <SolidFigure kind={shape} className="h-full w-full" />
                  </div>
                ) : null}
                <div data-text="label" className="mt-6">{topicLabel(topic.number, t)}</div>
                <Heading level={2} data-topic-name="" className="mt-3">{topic.title}</Heading>
              </div>
              <ol className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pages.map((p, n) => (
                  <li key={p.to}>
                    <PlayTile to={p.to as never} number={n + 1} label={p.label} tex={p.tex} texSaid={p.texSaid} summary={summaries?.[topic.slug]?.[p.id]} />
                  </li>
                ))}
              </ol>
            </div>
            )}
          </Band>
        );
      })}
    </Page>
  );
}
