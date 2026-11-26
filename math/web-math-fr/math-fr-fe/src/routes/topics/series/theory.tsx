import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { useMemo } from "react";
import { Offline } from "@/components/Offline";
import { RailIndex } from "@/components/RailIndex";
import { Tex } from "@/components/Tex";
import { api } from "@/lib/api";
import { L } from "@/lib/lang";
import { TOPIC } from "@/lib/series";
import { useHere } from "@/lib/here";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/topics/series/theory")({
  loader: () => api.theory(TOPIC),
  component: TheoryPage,
});

const HEADING = L("The mathematics, all of it");

function TheoryPage() {
  const theory = Route.useLoaderData();

  const items = useMemo(() => {
    if (!theory) return [];
    return [
      { id: "measuring", label: L("Ideas used on every page") },
      ...theory.systems.map((s) => ({ id: s.id, label: s.name })),
    ];
  }, [theory]);

  const [here, go] = useHere(items.map((i) => i.id));

  if (!theory) {
    return (
      <div>
        <Heading level={1} className="mt-6">{HEADING}</Heading>
        <div className="mt-6">
          <Offline what={L("This page shows only formulas, and the formulas come from the server, which is not answering. The interactive pages of this topic draw their pictures without the server.")} />
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
          {L("All the formulas behind this topic, page by page. Each formula also appears on its own interactive page, below the picture. Every number in the notes was computed by the site's code, not copied from a book.")}
        </Text>

        <section id="measuring" className="mt-12 scroll-mt-24">
          <Heading level={2}>
            {L("Ideas used on every page")}
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
          <Heading level={2}>{L("The formulas of each page")}</Heading>
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
