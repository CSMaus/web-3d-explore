import { createFileRoute } from "@tanstack/react-router";
import { Equations } from "@/components/Equations";
import { PaletteBar } from "@/components/PaletteBar";
import { PlayTabs } from "@/components/PlayTabs";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { FRACTALS } from "@/lib/topic";

export const Route = createFileRoute("/topics/fractals/play/$system")({
  loader: ({ params }) => api.system(TOPIC, params.system),
  component: PlayOne,
});

function PlayOne() {
  const system = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={FRACTALS} />
      <div className="mt-4">
        <PlayTabs />
      </div>
      <h1 className="mt-4 font-mono text-sm tracking-wide text-leaf">
        {system?.name ?? "this system"}
      </h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">CONTROLS</h2>
            <p className="mt-2 text-xs text-muted">
              the parameters for this system arrive with its own page.
            </p>
            <div className="mt-4">
              <PaletteBar />
            </div>
          </section>
          <Equations system={system} />
        </div>
        <section className="min-h-[520px] rounded border border-edge" />
      </div>
    </main>
  );
}
