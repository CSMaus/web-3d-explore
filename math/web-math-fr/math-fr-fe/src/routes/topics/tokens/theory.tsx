import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { useMemo } from "react";
import { Offline } from "@/components/Offline";
import { RailIndex } from "@/components/RailIndex";
import { Tex } from "@/components/Tex";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/tokens";
import { useHere } from "@/lib/here";
import { useRise } from "@/lib/reveal";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/theory")({
  loader: () => api.theory(TOPIC),
  component: TheoryPage,
});

const HEADING = L("All the formulas of this topic");

function TheoryPage() {
  const theory = Route.useLoaderData();

  const items = useMemo(() => {
    if (!theory) return [];
    return [
      { id: "measuring", label: L("Formulas used on several pages") },
      ...theory.systems.map((s) => ({ id: s.id, label: s.name })),
    ];
  }, [theory]);

  const [here, go] = useHere(items.map((i) => i.id));

  if (!theory) {
    return (
      <div>
        <Heading level={1} className="mt-6">{HEADING}</Heading>
        <div className="mt-6">
          <Offline what={L("This page shows only formulas, and they come from the site's server. The server is not answering, so there is nothing to show. The interactive pages work without it.")} />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-[45vh]">
      <RailIndex items={items} here={here} onPick={go} />

      <div className="min-w-0">
        <Heading level={1} className="mt-6">{HEADING}</Heading>
        <Text kind="intro" as="p" className="mt-3 max-w-2xl">
          {L("Every formula behind this topic, which shows how a language model cuts text into tokens (pieces such as words), turns them into numbers and writes text one token at a time. Each formula also appears on the interactive page it belongs to, with a note in plain words. Every number in the notes was computed by the site's code, not copied from a book.")}
        </Text>

        <section id="measuring" className="mt-12 scroll-mt-24">
          <Heading level={2}>
            {L("Formulas used on several pages")}
          </Heading>
          <div className="mt-4 space-y-6">
            {theory.definitions.map((d, i) => (
              <Card key={d.id} delay={i * 70}>
                <div data-text="label">
                  {d.name}
                </div>
                <Tex tex={d.tex} block />
                <Text kind="note" as="p">{d.note}</Text>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <Heading level={2}>{L("Formulas, page by page")}</Heading>
          <div className="mt-4 space-y-10">
            {theory.systems.map((s, i) => (
              <div key={s.id} id={s.id} className="scroll-mt-24">
                <Card delay={i * 60}>
                  <div data-text="itemTitle">{s.name}</div>
                  <Text kind="note" as="p" className="mt-1">{s.summary}</Text>
                  <div className="mt-4 space-y-4">
                    {s.blocks.map((b) => (
                      <div key={b.label}>
                        <div data-text="label">
                          {b.label}
                        </div>
                        <Tex tex={b.tex} block />
                        <div data-text="note">{b.note}</div>
                      </div>
                    ))}
                    <div className="border-t border-border pt-3">
                      <div data-text="label">
                        {s.dimension.label}
                      </div>
                      <Tex tex={s.dimension.tex} block />
                      <div data-text="note">{s.dimension.note}</div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ children, delay }: { children: React.ReactNode; delay: number }) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} data-slot="panel" className="rise">
      {children}
    </div>
  );
}
