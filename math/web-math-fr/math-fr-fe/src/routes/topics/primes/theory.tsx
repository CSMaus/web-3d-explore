import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { useMemo } from "react";
import { Offline } from "@/components/Offline";
import { RailIndex } from "@/components/RailIndex";
import { Tex } from "@/components/Tex";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/primes";
import { useHere } from "@/lib/here";
import { useRise } from "@/lib/reveal";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/primes/theory")({
  loader: () => api.theory(TOPIC),
  component: TheoryPage,
});

const HEADING = L("The formulas behind the page");

function TheoryPage() {
  const theory = Route.useLoaderData();

  const items = useMemo(() => {
    if (!theory) return [];
    return [
      { id: "measuring", label: L("Two tools: the sieve and the return map") },
      ...theory.systems.map((s) => ({ id: s.id, label: s.name })),
    ];
  }, [theory]);

  const [here, go] = useHere(items.map((i) => i.id));

  if (!theory) {
    return (
      <div>
        <Heading level={1} className="mt-6">{HEADING}</Heading>
        <div className="mt-6">
          <Offline what={L("This tab shows only formulas, and they come from the site's server. The server is not answering, so there is nothing to show. The page under the Play tab draws its pictures without the server.")} />
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
          {L("Every formula used on the page about the gaps between prime numbers, with what each letter stands for. The same formulas also appear at the bottom of that page. Every number in the notes was computed by the page's own code, not copied from a book.")}
        </Text>

        <section id="measuring" className="mt-12 scroll-mt-24">
          <Heading level={2}>
            {L("Two tools: the sieve and the return map")}
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
          <Heading level={2}>{L("The page and its formulas")}</Heading>
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
