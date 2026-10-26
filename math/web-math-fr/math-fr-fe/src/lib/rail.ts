import type { LinkProps } from "@tanstack/react-router";
import { SYSTEMS as CHAOS_PAGES } from "@/lib/chaos";
import { SYSTEMS as COMPLEX_PAGES } from "@/lib/complex";
import { GROUPS as NET_GROUPS, SYSTEMS as NET_PAGES } from "@/lib/networks";
import { SYSTEMS as PRIMES_PAGES } from "@/lib/primes";
import { SYSTEMS as FRACTAL_PAGES } from "@/lib/systems";
import { GROUPS as TOKEN_GROUPS, SYSTEMS as TOKEN_PAGES } from "@/lib/tokens";
import type { BuiltTopic } from "@/lib/topic";
import { usesOf } from "@/lib/uses";
import { L } from "@/lib/lang";

/**
 * what the rail beside a topic lists under a section: the pages of the play
 * section in their groups, and the applications. a topic with one flat row of
 * pages has one group with no heading.
 */
export type RailLink = { to: LinkProps["to"]; label: string; params?: Record<string, string>; exact?: boolean; tex?: string; texSaid?: string };
export type RailGroup = { heading?: string; links: RailLink[] };

type Page = { readonly to: string; readonly label: string; readonly group?: string; readonly tex?: string; readonly texSaid?: string };

function grouped(pages: readonly Page[], groups: readonly string[]): RailGroup[] {
  return groups.map((heading) => ({
    heading,
    links: pages.filter((p) => p.group === heading).map((p) => ({ to: p.to as LinkProps["to"], label: p.label })),
  }));
}

function flat(pages: readonly Page[]): RailGroup[] {
  return [{ links: pages.map((p) => ({ to: p.to as LinkProps["to"], label: p.label, tex: p.tex, texSaid: p.texSaid })) }];
}

const PLAY: Record<string, RailGroup[]> = {
  fractals: flat(FRACTAL_PAGES),
  chaos: flat(CHAOS_PAGES),
  complex: flat(COMPLEX_PAGES),
  networks: grouped(NET_PAGES, NET_GROUPS),
  tokens: grouped(TOKEN_PAGES, TOKEN_GROUPS),
  primes: flat(PRIMES_PAGES),
};

/** the pages under one section of a topic; none for the sections that are one page */
export function pagesOf(topic: BuiltTopic, section: string): RailGroup[] {
  if (section.endsWith("/play")) {
    const groups = PLAY[topic.slug] ?? [];
    return [{ links: [{ to: section as LinkProps["to"], label: L("All"), exact: true }] }, ...groups];
  }
  if (section.endsWith("/uses")) {
    const pieces = usesOf(topic.slug).flatMap((u): RailLink[] => {
      if (u.to) return [{ to: u.to, label: u.label }];
      if (u.piece) return [{ to: `/topics/${topic.slug}/uses/$piece` as LinkProps["to"], params: { piece: u.piece }, label: u.label }];
      return [];
    });
    return [{ links: [{ to: section as LinkProps["to"], label: L("All"), exact: true }, ...pieces] }];
  }
  return [];
}
