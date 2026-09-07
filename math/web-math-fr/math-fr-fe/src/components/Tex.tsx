import katex from "katex";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

type Props = { tex: string; block?: boolean; className?: string };

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
      className={cn(block && "block overflow-x-auto py-1", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
