import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Offline } from "@/components/Offline";
import { TopicBar } from "@/components/TopicBar";
import { Rail } from "@/components/Rail";
import { Tex } from "@/components/Tex";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { FRACTALS } from "@/lib/topic";
import { useHere } from "@/lib/here";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/topics/fractals/theory")({
  loader: () => api.theory(TOPIC),
  component: TheoryPage,
});

const HEADING = "the mathematics, all of it";

function TheoryPage() {
  const theory = Route.useLoaderData();

  const items = useMemo(() => {
    if (!theory) return [];
    return [
      { id: "measuring", label: "how dimension is measured" },
      ...theory.systems.map((s) => ({ id: s.id, label: s.name })),
    ];
  }, [theory]);

  const [here, go] = useHere(items.map((i) => i.id));

  if (!theory) {
    return (
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
        <TopicBar topic={FRACTALS} />
        <h1 className="mt-6 font-mono text-sm tracking-wide text-leaf">{HEADING}</h1>
        <div className="mt-6">
          <Offline what="this page is nothing but the equations, so it has nothing to show until the backend answers. the play pages draw their fractals without it." />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-[45vh] xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
      <Rail className="hidden xl:block" items={items} here={here} onPick={go} />

      <div className="min-w-0">
        <TopicBar topic={FRACTALS} />
        <h1 className="mt-6 font-mono text-sm tracking-wide text-leaf">{HEADING}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          every equation the site draws from. each one also sits on the page of the system it
          belongs to.
        </p>

        <section id="measuring" className="mt-12 scroll-mt-24">
          <h2 className="font-mono text-xs uppercase tracking-widest text-sky">
            how dimension is measured
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
          <h2 className="font-mono text-xs uppercase tracking-widest text-sky">the systems</h2>
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
