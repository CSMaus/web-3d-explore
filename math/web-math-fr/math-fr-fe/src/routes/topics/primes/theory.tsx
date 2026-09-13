import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Offline } from "@/components/Offline";
import { TopicBar } from "@/components/TopicBar";
import { Rail } from "@/components/Rail";
import { Tex } from "@/components/Tex";
import { api } from "@/lib/api";
import { PRIMES, TOPIC } from "@/lib/primes";
import { useHere } from "@/lib/here";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/topics/primes/theory")({
  loader: () => api.theory(TOPIC),
  component: TheoryPage,
});

const HEADING = "The mathematics, all of it";

function TheoryPage() {
  const theory = Route.useLoaderData();

  const items = useMemo(() => {
    if (!theory) return [];
    return [
      { id: "measuring", label: "The shared machinery" },
      ...theory.systems.map((s) => ({ id: s.id, label: s.name })),
    ];
  }, [theory]);

  const [here, go] = useHere(items.map((i) => i.id));

  if (!theory) {
    return (
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
        <TopicBar topic={PRIMES} />
        <h1 className="mt-6 font-mono text-sm tracking-wide text-leaf">{HEADING}</h1>
        <div className="mt-6">
          <Offline what="This page is nothing but the equations, so it has nothing to show until the backend answers. The play pages draw their pictures without it." />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-[45vh] xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
      <Rail className="hidden xl:block" items={items} here={here} onPick={go} />

      <div className="min-w-0">
        <TopicBar topic={PRIMES} />
        <h1 className="mt-6 font-mono text-sm tracking-wide text-leaf">{HEADING}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Every equation this topic rests on. Each one also sits on the page of the system it
          belongs to, and every number quoted in a note was measured by the code rather than
          copied from a reference.
        </p>

        <section id="measuring" className="mt-12 scroll-mt-24">
          <h2 className="font-mono text-xs uppercase tracking-widest text-sky">
            The shared machinery
          </h2>
          <div className="mt-4 space-y-6">
            {theory.definitions.map((d, i) => (
              <Card key={d.id} delay={i * 70}>
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  {d.name}
                </div>
                <Tex tex={d.tex} block />
                <p className="text-xs text-muted">{d.note}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-mono text-xs uppercase tracking-widest text-sky">The systems</h2>
          <div className="mt-4 space-y-10">
            {theory.systems.map((s, i) => (
              <div key={s.id} id={s.id} className="scroll-mt-24">
                <Card delay={i * 60}>
                  <div className="font-mono text-sm text-ink">{s.name}</div>
                  <p className="mt-1 text-xs text-muted">{s.summary}</p>
                  <div className="mt-4 space-y-4">
                    {s.blocks.map((b) => (
                      <div key={b.label}>
                        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
                          {b.label}
                        </div>
                        <Tex tex={b.tex} block />
                        <div className="text-xs text-muted">{b.note}</div>
                      </div>
                    ))}
                    <div className="border-t border-edge pt-3">
                      <div className="font-mono text-[11px] uppercase tracking-wider text-leaf">
                        {s.dimension.label}
                      </div>
                      <Tex tex={s.dimension.tex} block />
                      <div className="text-xs text-muted">{s.dimension.note}</div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ children, delay }: { children: React.ReactNode; delay: number }) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} className="rise rounded border border-edge p-4">
      {children}
    </div>
  );
}
