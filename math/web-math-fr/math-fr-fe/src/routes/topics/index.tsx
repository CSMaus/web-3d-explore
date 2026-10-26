import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Band, Button, Text, Heading, Hero, Page, SolidFigure } from "@kit/index";
import { Offline } from "@/components/Offline";
import { api, type Card } from "@/lib/api";
import { useRise } from "@/lib/reveal";
import { SHAPES, topicLabel } from "@/lib/shapes";
import { builtAt } from "@/lib/topic";

export const Route = createFileRoute("/topics/")({
  loader: () => api.topics(),
  component: TopicsPage,
});

const WORD: Record<Card["state"], string> = {
  ready: "Ready",
  writing: "Being written",
  planned: "Planned",
};

/**
 * the topics, one band the width of the screen each, in reading order: the topic's
 * turning figure large on one side, its name, what it is and what exists of it on
 * the other, the sides changing from band to band and the bands changing tone. the
 * asides follow in a quiet list.
 */
function TopicsPage() {
  const topics = Route.useLoaderData();

  return (
    <Page className="pb-0">
      <Hero
        size="page"
        title="The topics"
        lede="One subject a topic, in reading order. Each is a series of short clips with the reasoning beside them, a set of pages where the thing is moved by hand, and every equation it rests on."
      />

      {!topics ? (
        <div className="pb-24">
          <Offline what="The list of topics is served by the backend. The first topic is at /topics/fractals either way." />
        </div>
      ) : (
        <>
          <ol>
            {topics.filter((t) => !t.aside).map((topic, i) => (
              <Scene key={topic.slug} topic={topic} flip={i % 2 === 1} />
            ))}
          </ol>
          {topics.some((t) => t.aside) ? (
            <section className="max-w-4xl py-16">
              <Heading level={2}>Asides</Heading>
              <Text kind="note" as="p" className="mt-2 max-w-2xl">
                Short pages beside the reading order, not in it. Each answers one question that came up.
              </Text>
              <ol className="mt-4 space-y-3">
                {topics.filter((t) => t.aside).map((topic, i) => (
                  <Aside key={topic.slug} topic={topic} delay={i * 70} />
                ))}
              </ol>
            </section>
          ) : null}
        </>
      )}
    </Page>
  );
}

function Aside({ topic, delay }: { topic: Card; delay: number }) {
  const ref = useRise<HTMLLIElement>(delay);
  const built = builtAt(topic.slug);
  return (
    <li ref={ref} className="rise">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border/60 px-4 py-3">
        <div className="min-w-0">
          <div data-text="caption">{topic.title}</div>
          <Text kind="note" as="p" className="mt-1">{topic.summary}</Text>
        </div>
        {built ? (
          <Button variant="outline" className="shrink-0" asChild>
            <Link to={built.landing}>Open the aside</Link>
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function Scene({ topic, flip }: { topic: Card; flip: boolean }) {
  const { t } = useTranslation();
  const ref = useRise<HTMLDivElement>(0);
  const [lit, setLit] = useState(false);
  // a topic is worth opening as soon as it has pages, which is before it has
  // clips. only the plan-only ones stay closed.
  const built = builtAt(topic.slug);
  const ready = topic.state === "ready";
  const minutes = Math.round(topic.seconds / 60);
  const shape = SHAPES[topic.slug];

  const what = ready
    ? `${topic.parts} parts, ${topic.beats} beats, about ${minutes} minutes, ${topic.systems} things to move`
    : built
      ? `${topic.systems} things to move, and every equation. No clip filmed yet`
      : "The plan is written; nothing is built yet";

  return (
    <li>
      <Band tone={flip ? "card" : "page"} onMouseEnter={() => setLit(true)} onMouseLeave={() => setLit(false)} onFocus={() => setLit(true)} onBlur={() => setLit(false)}>
        <div ref={ref} className={`rise grid items-center gap-10 md:grid-cols-2 md:gap-16 ${built ? "" : "opacity-70"}`}>
          <div className={`mx-auto aspect-square w-full max-w-[420px] ${flip ? "md:order-2" : ""}`}>
            {shape ? <SolidFigure kind={shape} lit={lit} className="h-full w-full" /> : null}
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span data-text="label">{topicLabel(topic.number, t)}</span>
              <span className={ready ? "font-mono text-[11px] text-selected" : "font-mono text-[11px] text-muted-foreground"}>
                {WORD[topic.state]}
              </span>
            </div>
            <Heading level={2} className="mt-3">{topic.title}</Heading>
            <Text kind="intro" as="p" className="mt-4 max-w-xl">{topic.summary}</Text>
            <div data-text="caption" className="mt-4">{what}</div>
            {built ? (
              <div className="mt-8">
                <Button asChild>
                  <Link to={built.landing}>{t("front.openTopic")}</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </Band>
    </li>
  );
}
