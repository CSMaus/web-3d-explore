import type { Token } from "@/systems/bpe";

/** a token id painted as a stable colour, so the same token looks the same everywhere. */
export function hue(id: number) {
  return `hsl(${(id * 47) % 360} 45% 32%)`;
}

/** a leading space shown as a mark, so it is seen to be inside the token. */
export function visible(text: string) {
  return text.replace(/ /g, "␣").replace(/\n/g, "⏎");
}

type Props = {
  tokens: Token[];
  /** show the id under each token */
  ids?: boolean;
  /** index of the token to ring */
  mark?: number | null;
  /** indices drawn dim */
  dimFrom?: number;
  size?: "sm" | "md";
};

/** a sequence of tokens as chips, boundaries visible, in reading order. */
export function TokenRow({ tokens, ids = false, mark = null, dimFrom, size = "md" }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {tokens.map((t, i) => (
        <span
          key={i}
          className={`inline-flex flex-col items-center rounded border px-1.5 py-0.5 font-mono ${size === "sm" ? "text-[11px]" : "text-[13px]"} ${mark === i ? "border-leaf" : "border-transparent"} ${dimFrom !== undefined && i >= dimFrom ? "opacity-30" : ""}`}
          style={{ background: hue(t.id) }}
          title={`Token ${t.id}, ${t.bytes.length} byte${t.bytes.length === 1 ? "" : "s"}`}
        >
          <span className="text-ink">{visible(t.text)}</span>
          {ids ? <span className="text-[9px] text-ink/60">{t.id}</span> : null}
        </span>
      ))}
    </div>
  );
}
