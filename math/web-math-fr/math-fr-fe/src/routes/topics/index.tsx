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
  ready: "ready",
  writing: "being written",
  planned: "planned",
};

function TopicsPage() {
  const topics = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
      <h1 className="font-mono text-sm tracking-wide text-leaf">the topics</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        one subject a topic, in reading order. each is a series of short clips with the reasoning
        beside them, a set of pages to move the thing yourself, and every equation it rests on.
      </p>

      {!topics ? (
        <div className="mt-8">
          <Offline what="the list of topics is served by the backend. the first topic is at /topics/fractals either way." />
        </div>
      ) : (
        <ol className="mt-10 max-w-4xl space-y-4">
          {topics.map((topic, i) => (
            <Tile key={topic.slug} topic={topic} delay={i * 70} />
          ))}
        </ol>
      )}
    </main>
  );
}

function Tile({ topic, delay }: { topic: Card; delay: number }) {
  const ref = useRise<HTMLLIElement>(delay);
  const built = builtAt(topic.slug);
  const ready = topic.state === "ready" && built !== null;
  const minutes = Math.round(topic.seconds / 60);

  const body = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-sm text-ink">
          topic {topic.number} - {topic.title}
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
      <div className="mt-3 font-mono text-[11px] text-muted">
        {ready
          ? `${topic.parts} parts, ${topic.beats} beats, about ${minutes} minutes, ${topic.systems} things to move`
          : "the plan is written; nothing is built yet"}
      </div>
    </>
  );

  return (
    <li ref={ref} className="rise">
      {ready && built ? (
        <Link
          to={built.sections[0].to}
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
