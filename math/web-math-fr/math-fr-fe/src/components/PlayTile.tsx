import { Link, type LinkProps } from "@tanstack/react-router";
import { LineFigure, Text } from "@kit/index";
import { Tex } from "@/components/Tex";
import { glyphOf } from "@/lib/glyphs";

/**
 * one interactive page as a small tile: a drawing of what the page shows with the
 * light running on it (lib/glyphs.ts), its number in the topic, its name and its
 * summary. a thin border, little padding. the tile lifts and its light runs faster
 * under the pointer or the keyboard.
 */
export function PlayTile({
  to,
  number,
  label,
  tex,
  texSaid,
  summary,
}: {
  to: LinkProps["to"];
  number: number;
  label: string;
  tex?: string;
  texSaid?: string;
  summary?: string;
}) {
  const glyph = glyphOf(String(to));
  return (
    <Link to={to} data-tile="" className="fractal-obstacle group flex h-full items-start gap-3">
      {glyph ? <LineFigure d={glyph.d} walk={glyph.walk} className="shrink-0" style={{ width: 56, height: 56 }} /> : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span data-text="label" className="tabular-nums">{String(number).padStart(2, "0")}</span>
          <span aria-hidden="true" className="text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
        </span>
        <span data-text="itemTitle" className="mt-0.5 block">
          {label}
          {tex ? (
            <>
              <span aria-hidden="true"> | </span>
              <span role="img" aria-label={texSaid} className="inline-block align-middle">
                <Tex tex={tex} />
              </span>
            </>
          ) : null}
        </span>
        {summary ? (
          <Text kind="note" as="span" className="mt-1" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {summary}
          </Text>
        ) : null}
      </span>
    </Link>
  );
}
