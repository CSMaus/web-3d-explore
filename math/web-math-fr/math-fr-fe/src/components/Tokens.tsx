import { kitTheme, useMode } from "@kit/index";
import type { Token } from "@/systems/bpe";
import { hue, visible } from "@/lib/tokenText";

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
  const mode = useMode(kitTheme.colours.default);
  return (
    <div className="flex flex-wrap gap-1">
      {tokens.map((t, i) => {
        // a token not yet reached is an outline with no fill, not a faded chip, so its text keeps its contrast
        const dim = dimFrom !== undefined && i >= dimFrom;
        return (
          <span
            key={i}
            className={`inline-flex flex-col items-center rounded border px-1.5 py-0.5 font-mono text-foreground ${size === "sm" ? "text-[11px]" : "text-[13px]"} ${mark === i ? "border-selected" : dim ? "border-dashed border-border" : "border-transparent"}`}
            style={dim ? undefined : { background: hue(t.id, mode === "light") }}
            title={`Token ${t.id}, ${t.bytes.length} byte${t.bytes.length === 1 ? "" : "s"}`}
          >
            <span>{visible(t.text)}</span>
            {ids ? <span data-text="note" style={{ color: "inherit" }}>{t.id}</span> : null}
          </span>
        );
      })}
    </div>
  );
}
