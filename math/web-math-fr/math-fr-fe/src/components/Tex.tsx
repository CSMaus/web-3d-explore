import katex from "katex";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

type Props = { tex: string; block?: boolean; className?: string };

/**
 * a formula. a long one never widens what holds it: a block formula takes no width of its own
 * (contain: inline-size) and scrolls sideways inside its panel, an inline one is capped at its
 * line's width and scrolls the same way.
 */
export function Tex({ tex, block = false, className }: Props) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        strict: false,
        output: "html",
      }),
    [tex, block],
  );
  return (
    <span
      className={cn(block ? "block max-w-full overflow-x-auto py-1 [contain:inline-size]" : "inline-block max-w-full overflow-x-auto overflow-y-hidden py-0.5 align-middle", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
