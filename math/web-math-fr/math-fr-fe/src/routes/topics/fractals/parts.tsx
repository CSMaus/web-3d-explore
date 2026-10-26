import { createFileRoute } from "@tanstack/react-router";
import { Heading, Swatch, Text } from "@kit/index";
import { useCallback } from "react";
import { Offline } from "@/components/Offline";
import { RailIndex } from "@/components/RailIndex";
import { Reel } from "@/components/Reel";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { useHere } from "@/lib/here";
import { useLook } from "@/lib/store";

export const Route = createFileRoute("/topics/fractals/parts")({
  loader: () => api.topic(TOPIC),
  component: TopicPage,
});

const HEADING = "The series, in order";

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
      <div>
        <Heading level={1} className="mt-6">{HEADING}</Heading>
        <div className="mt-6">
          <Offline what="The beats and the words beside them are served by the backend." />
        </div>
      </div>
    );
  }

  const minutes = Math.round(topic.seconds / 60);

  return (
    <div className="pb-24">
      <RailIndex
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
          <Heading level={1} className="mt-6">{HEADING}</Heading>
          <Text kind="intro" as="p" className="mt-3 max-w-2xl">
            {topic.part_list.length} clips, one a part, about {minutes} minutes of picture in
            order. Beside each clip is the part's question and a short description of it.
          </Text>
        </header>

        <div className="mt-4">
          {topic.part_list.map((part, i) => (
            <section
              key={part.number}
              id={anchor(part.number)}
              className="scroll-mt-24 border-t border-border pt-10"
            >
              <Heading level={2}>
                <Swatch colour={accentOf(i)} />
                Part {part.number} - {part.title}
              </Heading>
              <Reel part={part} accent={accentOf(i)} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
