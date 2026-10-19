import { createFileRoute } from "@tanstack/react-router";
import { Label, Text, Heading } from "@kit/index";
import { Equations } from "@/components/Equations";
import { PaletteBar } from "@/components/PaletteBar";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";

export const Route = createFileRoute("/topics/fractals/play/$system")({
  loader: ({ params }) => api.system(TOPIC, params.system),
  component: PlayOne,
});

function PlayOne() {
  const system = Route.useLoaderData();
  return (
    <div>
      <Heading level={1} className="mt-4">
        {system?.name ?? "This system"}
      </Heading>
      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <section data-slot="panel">
            <Label>CONTROLS</Label>
            <Text kind="note" as="p" className="mt-2">
              The parameters for this system arrive with its own page.
            </Text>
            <div className="mt-4">
              <PaletteBar />
            </div>
          </section>
          <Equations system={system} />
        </div>
        <section data-slot="plot" className="min-h-[520px]" />
      </div>
    </div>
  );
}
