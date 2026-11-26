import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { useMemo } from "react";
import { Offline } from "@/components/Offline";
import { RailIndex } from "@/components/RailIndex";
import { Tex } from "@/components/Tex";
import { api } from "@/lib/api";
import { L } from "@/lib/lang";
import { TOPIC } from "@/lib/complex";
import { useHere } from "@/lib/here";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/topics/complex/theory")({
  loader: () => api.theory(TOPIC),
  component: TheoryPage,
});

const HEADING = L("Every formula of the topic, explained in words");

function TheoryPage() {
  const theory = Route.useLoaderData();

  const items = useMemo(() => {
    if (!theory) return [];
    return [
      { id: "measuring", label: L("Basic definitions used on every page") },
      ...theory.systems.map((s) => ({ id: s.id, label: s.name })),
    ];
  }, [theory]);

  const [here, go] = useHere(items.map((i) => i.id));

  if (!theory) {
    return (
      <div>
        <Heading level={1} className="mt-6">{HEADING}</Heading>
        <div className="mt-6">
          <Offline what={L("This page shows only formulas, and they are loaded from the server, which is not answering now. The interactive pages of the topic work without the server.")} />
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
          {L("Every formula of the topic 'Imaginary numbers', with an explanation in words under each one. The same formulas also appear below the interactive page they belong to. The numbers quoted in the explanations were computed by the site's code, not copied from books.")}
        </Text>

        <section id="measuring" className="mt-12 scroll-mt-24">
          <Heading level={2}>
            {L("Basic definitions used on every page")}
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
