import { Tex } from "@/components/Tex";
import { Label, Text } from "@kit/index";
import type { System } from "@/lib/api";

export function Equations({ system }: { system: System | null }) {
  if (!system) {
    return (
      <section data-slot="panel">
        <Label>MATHEMATICS</Label>
        <Text kind="note" as="p" className="mt-2">
          The equations are served by the backend, which is not answering. The picture beside this
          panel is drawn in the browser and needs nothing from it.
        </Text>
      </section>
    );
  }
  return (
    <section data-slot="panel">
      <Label>MATHEMATICS</Label>
      <Text kind="intro" as="p" className="mt-2">{system.summary}</Text>
      <div className="mt-4 space-y-4">
        {system.blocks.map((block) => (
          <div key={block.label}>
            <div data-text="label">
              {block.label}
            </div>
            <Tex tex={block.tex} block />
            <div data-text="note">{block.note}</div>
          </div>
        ))}
        <div className="border-t border-border pt-3">
          <div data-text="label">
            {system.dimension.label}
          </div>
          <Tex tex={system.dimension.tex} block />
          <div data-text="note">{system.dimension.note}</div>
        </div>
      </div>
    </section>
  );
}
