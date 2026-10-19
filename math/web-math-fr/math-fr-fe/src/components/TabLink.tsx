import { Link, type LinkProps } from "@tanstack/react-router";

/**
 * a link of a topic's sub-menu: the sections of a topic and the systems of a
 * play page. its text is the kit's "tab" style; the current one takes the mark.
 */
export function TabLink(props: LinkProps) {
  return <Link data-text="tab" className="rounded border border-border px-2.5 py-1 transition-colors hover:border-muted-foreground" {...props} />;
}
