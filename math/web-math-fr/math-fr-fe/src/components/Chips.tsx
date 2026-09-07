import { cn } from "@/lib/cn";

type Props = {
  items: string[];
  active: string;
  onPick: (item: string) => void;
  tint?: (item: string, i: number) => string | undefined;
};

export function Chips({ items, active, onPick, tint }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          aria-pressed={item === active}
          style={tint ? { color: tint(item, i) } : undefined}
          className={cn(
            "rounded border px-2 py-1 font-mono text-[11px] transition-colors",
            item === active ? "border-leaf" : "border-edge text-muted hover:border-muted",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
