import { Link, createFileRoute } from "@tanstack/react-router";
import { Button, Text, Heading, Page } from "@kit/index";
import { Offline } from "@/components/Offline";
import { api, type Card } from "@/lib/api";
import { useRise } from "@/lib/reveal";
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

function TopicsPage() {
  const topics = Route.useLoaderData();

  return (
    <Page className="pb-24">
      <Heading level={1}>The topics</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        One subject a topic, in reading order. Each is a series of short clips with the reasoning
        beside them, a set of pages where the thing is moved by hand, and every equation it rests on.
      </Text>

      {!topics ? (
        <div className="mt-8">
          <Offline what="The list of topics is served by the backend. The first topic is at /topics/fractals either way." />
        </div>
      ) : (
        <>
          <ol className="mt-10 max-w-4xl space-y-4">
            {topics.filter((t) => !t.aside).map((topic, i) => (
              <Tile key={topic.slug} topic={topic} delay={i * 70} />
            ))}
          </ol>
          {topics.some((t) => t.aside) ? (
            <section className="mt-14 max-w-4xl border-t border-border pt-6">
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

function Tile({ topic, delay }: { topic: Card; delay: number }) {
  const ref = useRise<HTMLLIElement>(delay);
  // a topic is worth opening as soon as it has pages, which is before it has
  // clips. only the plan-only ones stay closed.
  const built = builtAt(topic.slug);
  const ready = topic.state === "ready";
  const minutes = Math.round(topic.seconds / 60);

  const what = ready
    ? `${topic.parts} parts, ${topic.beats} beats, about ${minutes} minutes, ${topic.systems} things to move`
    : built
      ? `${topic.systems} things to move, and every equation. no clip filmed yet`
      : "The plan is written; nothing is built yet";

  const body = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span data-text="itemTitle">
          {topic.number === 0 ? "Start here" : `Topic ${topic.number}`} - {topic.title}
        </span>
        <span
          className={
            ready
              ? "font-mono text-[11px] text-selected"
              : "font-mono text-[11px] text-muted-foreground"
          }
        >
          {WORD[topic.state]}
        </span>
      </div>
      <Text kind="note" as="p" className="mt-2">{topic.summary}</Text>
      <div data-text="caption" className="mt-3">{what}</div>
    </>
  );

  return (
    <li ref={ref} className="rise">
      {built ? (
        <Link
          to={built.landing}
          className="block rounded border border-border p-4 transition-colors hover:border-selected"
        >
          {body}
        </Link>
      ) : (
        <div className="rounded border border-border/60 p-4 opacity-70">{body}</div>
      )}
    </li>
  );
}
