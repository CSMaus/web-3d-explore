import { PALETTES } from "@/lib/palettes";
import { useLook } from "@/lib/store";
import { cn } from "@/lib/cn";

export function PaletteBar() {
  const { palette, setPalette } = useLook();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs text-muted">colour</span>
      {PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setPalette(p.id)}
          aria-pressed={p.id === palette.id}
          title={p.name}
          className={cn(
            "flex h-6 items-center gap-[3px] rounded border px-1.5 transition-colors",
            p.id === palette.id ? "border-leaf" : "border-edge hover:border-muted",
          )}
        >
          {p.roles.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
          ))}
        </button>
      ))}
    </div>
  );
}
