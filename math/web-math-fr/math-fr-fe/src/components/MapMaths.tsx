import { Tex } from "@/components/Tex";
import { cn } from "@/lib/cn";
import type { Map2 } from "@/systems/ifs";

type Props = {
  maps: Map2[];
  active: number;
  carrier: number;
  colourOf: (i: number) => string;
  tinted: boolean;
  onPick: (i: number) => void;
};

function num(v: number) {
  return v.toFixed(2);
}

function row(tag: string, u: number, v: number, w: number) {
  const sign = (n: number) => (n < 0 ? "-" : "+");
  return `${tag} = ${num(u)}\\,x ${sign(v)} ${num(Math.abs(v))}\\,y ${sign(w)} ${num(Math.abs(w))}`;
}

export function MapMaths({ maps, active, carrier, colourOf, tinted, onPick }: Props) {
  return (
    <div className="space-y-2">
      {maps.map((m, i) => {
        const colour = tinted ? colourOf(i) : undefined;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            aria-pressed={i === active}
            className={cn(
              "block w-full rounded border px-3 py-2 text-left transition-colors",
              i === active ? "border-leaf" : "border-edge hover:border-muted",
            )}
          >
            <div className="flex items-baseline justify-between font-mono text-[11px]">
              <span style={{ color: colour }}>move {i + 1}</span>
              <span className="text-muted">
                {i === carrier ? "carries the whole shape" : `chance ${m.p.toFixed(3)}`}
              </span>
            </div>
            <div style={{ color: colour }} className="mt-1 text-xs">
              <Tex tex={row("x'", m.a, m.b, m.e)} block />
              <Tex tex={row("y'", m.c, m.d, m.f)} block />
            </div>
          </button>
        );
      })}
    </div>
  );
}
