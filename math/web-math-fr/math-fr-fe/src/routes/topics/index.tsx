import { Link, createFileRoute } from "@tanstack/react-router";
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
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
      <h1 className="font-mono text-sm tracking-wide text-leaf">The topics</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        One subject a topic, in reading order. Each is a series of short clips with the reasoning
        beside them, a set of pages to move the thing yourself, and every equation it rests on.
      </p>

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
            <section className="mt-14 max-w-4xl border-t border-edge pt-6">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted">Asides</h2>
              <p className="mt-2 max-w-2xl text-xs text-muted">
                Short pages beside the reading order, not in it. Each answers one question that came up.
              </p>
              <ol className="mt-4 space-y-3">
                {topics.filter((t) => t.aside).map((topic, i) => (
                  <Aside key={topic.slug} topic={topic} delay={i * 70} />
                ))}
              </ol>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}

function Aside({ topic, delay }: { topic: Card; delay: number }) {
  const ref = useRise<HTMLLIElement>(delay);
  const built = builtAt(topic.slug);
  return (
    <li ref={ref} className="rise">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-edge/60 px-4 py-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-ink/80">{topic.title}</div>
          <p className="mt-1 text-xs leading-relaxed text-muted">{topic.summary}</p>
        </div>
        {built ? (
          <Link
            to={built.landing}
            className="shrink-0 rounded border border-leaf px-3 py-1.5 font-mono text-[11px] text-leaf transition-colors hover:bg-leaf/10"
          >
            Open the aside
          </Link>
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
        <span className="font-mono text-sm text-ink">
          {topic.number === 0 ? "Start here" : `Topic ${topic.number}`} - {topic.title}
        </span>
        <span
          className={
            ready
              ? "font-mono text-[11px] text-leaf"
              : "font-mono text-[11px] text-muted"
          }
        >
          {WORD[topic.state]}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{topic.summary}</p>
      <div className="mt-3 font-mono text-[11px] text-muted">{what}</div>
    </>
  );

  return (
    <li ref={ref} className="rise">
      {built ? (
        <Link
          to={built.landing}
          className="block rounded border border-edge p-4 transition-colors hover:border-leaf"
        >
          {body}
        </Link>
      ) : (
        <div className="rounded border border-edge/60 p-4 opacity-70">{body}</div>
      )}
    </li>
  );
}
