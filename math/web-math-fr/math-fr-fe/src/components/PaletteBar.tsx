import { PALETTES } from "@/lib/palettes";
import { useLook } from "@/lib/store";
import { cn } from "@/lib/cn";

/** the palettes of the play pages as chips: the ones in code, then the ones added in the browser. */
export function PaletteBar() {
  const palette = useLook((s) => s.palette);
  const setPalette = useLook((s) => s.setPalette);
  const saved = useLook((s) => s.saved);
  const palettes = [...PALETTES, ...saved];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span data-text="caption">Colour</span>
      {palettes.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setPalette(p.id)}
          aria-pressed={p.id === palette.id}
          aria-label={p.name}
          title={p.name}
          className={cn(
            "flex h-6 items-center gap-[3px] rounded border px-1.5 transition-colors",
            p.id === palette.id ? "border-selected" : "border-border hover:border-muted-foreground",
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
