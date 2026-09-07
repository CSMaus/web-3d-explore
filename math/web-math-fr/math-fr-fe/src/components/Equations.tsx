import { Tex } from "@/components/Tex";
import type { System } from "@/lib/api";

export function Equations({ system }: { system: System | null }) {
  if (!system) {
    return (
      <section className="rounded border border-edge p-4">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-leaf">MATHEMATICS</h2>
        <p className="mt-2 text-xs text-muted">
          the equations are served by the backend, which is not answering. the picture beside this
          panel is drawn in the browser and needs nothing from it.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded border border-edge p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-wider text-leaf">MATHEMATICS</h2>
      <p className="mt-2 text-sm text-muted">{system.summary}</p>
      <div className="mt-4 space-y-4">
        {system.blocks.map((block) => (
          <div key={block.label}>
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {block.label}
            </div>
            <Tex tex={block.tex} block />
            <div className="text-xs text-muted">{block.note}</div>
          </div>
        ))}
        <div className="border-t border-edge pt-3">
          <div className="font-mono text-[11px] uppercase tracking-wider text-sky">
            {system.dimension.label}
          </div>
          <Tex tex={system.dimension.tex} block />
          <div className="text-xs text-muted">{system.dimension.note}</div>
        </div>
      </div>
    </section>
  );
}
