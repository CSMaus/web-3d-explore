import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { Offline } from "@/components/Offline";
import { TopicBar } from "@/components/TopicBar";
import { Rail } from "@/components/Rail";
import { Reel } from "@/components/Reel";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { FRACTALS } from "@/lib/topic";
import { useHere } from "@/lib/here";
import { useLook } from "@/lib/store";

export const Route = createFileRoute("/topics/fractals/parts")({
  loader: () => api.topic(TOPIC),
  component: TopicPage,
});

const HEADING = "the series, in order";

const anchor = (number: number) => `part-${number}`;

function TopicPage() {
  const topic = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const [here, go] = useHere((topic?.part_list ?? []).map((part) => anchor(part.number)));

  const accentOf = useCallback(
    (i: number) => palette.roles[i % palette.roles.length],
    [palette],
  );

  if (!topic) {
    return (
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
        <TopicBar topic={FRACTALS} />
        <h1 className="mt-6 font-mono text-sm tracking-wide text-leaf">{HEADING}</h1>
        <div className="mt-6">
          <Offline what="the beats and the words beside them are served by the backend." />
        </div>
      </main>
    );
  }

  const minutes = Math.round(topic.seconds / 60);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24 xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
      <Rail
        className="hidden xl:block"
        here={here}
        onPick={go}
        items={topic.part_list.map((part, i) => ({
          id: anchor(part.number),
          label: `${part.number}. ${part.title}`,
          accent: accentOf(i),
        }))}
      />

      <div className="min-w-0">
        <header>
          <TopicBar topic={FRACTALS} />
          <h1 className="mt-6 font-mono text-sm tracking-wide text-leaf">{HEADING}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            {topic.beats} beats across {topic.part_list.length} parts, about {minutes} minutes of
            picture. each clip holds still while the reasoning for that beat scrolls past it.
          </p>
        </header>

        <div className="mt-4">
          {topic.part_list.map((part, i) => (
            <section
              key={part.number}
              id={anchor(part.number)}
              className="scroll-mt-24 border-t border-edge pt-10"
            >
              <h2
                className="font-mono text-xs uppercase tracking-widest"
                style={{ color: accentOf(i) }}
              >
                part {part.number} - {part.title}
              </h2>
              {part.beats.map((beat) => (
                <Reel key={beat.slug} beat={beat} accent={accentOf(i)} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
