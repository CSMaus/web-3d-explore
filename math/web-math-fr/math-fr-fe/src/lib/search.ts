import type { Card } from "@/lib/api";
import { SYSTEMS as CHAOS_PAGES } from "@/lib/chaos";
import { SYSTEMS as COMPLEX_PAGES } from "@/lib/complex";
import { SYSTEMS as NETWORK_PAGES } from "@/lib/networks";
import { SYSTEMS as PRIMES_PAGES } from "@/lib/primes";
import { SYSTEMS as FRACTAL_PAGES } from "@/lib/systems";
import { SYSTEMS as TOKEN_PAGES } from "@/lib/tokens";
import { BUILT } from "@/lib/topic";
import { EDUCATION, NAME, PAPERS, REGISTERED, SUMMARY, WORK } from "@/content/about";
import { PROJECTS } from "@/content/projects";
import { USES } from "@/lib/uses";
import { L } from "@/lib/lang";

/**
 * search over the whole site, in the browser. the index is everything the
 * front end knows about itself: the pages, the topics and their sections, and
 * every interactive page by name; the backend's summaries are folded in when
 * it answers. nothing is fetched to search.
 */

export type Hit = {
  to: string;
  title: string;
  /** where on the site the hit lives, for the eye */
  place: string;
  text: string;
  score: number;
};

type Entry = Omit<Hit, "score">;

const PAGES: Entry[] = [
  { to: "/", title: L("Front page"), place: L("Site"), text: "see the idea then understand the math start with fractals browse all topics" },
  { to: "/learn", title: L("Learn"), place: L("Site"), text: "the series of every topic short clips reasoning" },
  { to: "/topics", title: L("Topics"), place: L("Site"), text: "one subject a topic in reading order" },
  { to: "/play", title: L("Play"), place: L("Site"), text: "every page that moves what goes in run what came out" },
  { to: "/about", title: L("About"), place: L("Site"), text: "who makes this and what for portfolio" },
  { to: "/projects", title: L("Projects"), place: L("Site"), text: "what is being built" },
  { to: "/contact", title: L("Contact"), place: L("Site"), text: "how to get in touch" },
  { to: "/account", title: L("Account"), place: L("Site"), text: "log in sign in create an account saved parameter sets" },
];

/** the words of the about page itself: the name, the work, the education, the papers and the programs, so a search for any of them finds it */
const ABOUT_TEXT = [
  NAME,
  SUMMARY,
  ...WORK.flatMap((j) => [j.role, j.place, j.what ?? ""]),
  ...EDUCATION.flatMap((e) => [e.degree, e.place]),
  ...PAPERS.flatMap((p) => [p.title, p.authors, p.venue]),
  ...REGISTERED.flatMap((r) => [r.english, r.title, r.authors, r.number]),
].join(" ");

const PLAY = [
  [L("Fractals"), FRACTAL_PAGES],
  [L("Differential equations, attractors and chaos"), CHAOS_PAGES],
  [L("Calculus into a first neural network"), NETWORK_PAGES],
  [L("Tokens, embeddings and generation"), TOKEN_PAGES],
  [L("Imaginary numbers"), COMPLEX_PAGES],
  [L("An aside: the gaps between primes"), PRIMES_PAGES],
] as const;

function baseIndex(): Entry[] {
  const out: Entry[] = PAGES.map((p) => (p.to === "/about" ? { ...p, text: `${p.text} ${ABOUT_TEXT}` } : p));
  for (const topic of Object.values(BUILT)) {
    for (const section of topic.sections) {
      out.push({ to: section.to, title: `${topic.title}: ${section.label}`, place: L("Topic {{n}}", { n: topic.number }), text: `${topic.title} ${section.label}` });
    }
  }
  for (const [topic, pages] of PLAY) {
    for (const p of pages) {
      const group = "group" in p ? (p as { group: string }).group : "";
      out.push({ to: p.to, title: p.label, place: topic, text: `${p.label} ${group} ${p.id} ${topic}` });
    }
  }
  for (const [slug, uses] of Object.entries(USES)) {
    for (const u of uses) {
      out.push({ to: u.to ?? `/topics/${slug}/uses`, title: u.title, place: L("Applications"), text: `${u.title} ${u.summary} ${u.label} application ${slug}` });
    }
  }
  for (const project of PROJECTS) {
    out.push({ to: `/projects/${project.slug}`, title: project.title, place: L("Projects"), text: `${project.title} ${project.summary}` });
  }
  return out;
}

const BASE = baseIndex();

/** the backend's topic cards, when it answered, add their summaries to the index. */
export function withCards(cards: Card[] | null): Entry[] {
  if (!cards) return BASE;
  const extra: Entry[] = cards.map((c) => ({
    to: `/topics/${c.slug}`,
    title: c.title,
    place: c.aside ? L("Aside") : L("Topic {{n}}", { n: c.number }),
    text: `${c.title} ${c.summary}`,
  }));
  return [...extra, ...BASE];
}

const words = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** the hits for a query, best first. a title word counts three, a word starting a title word two, a word anywhere one. */
export function search(query: string, entries: Entry[] = BASE, most = 12): Hit[] {
  const terms = words(query);
  if (terms.length === 0) return [];
  const hits: Hit[] = [];
  for (const e of entries) {
    const title = words(e.title);
    const body = words(`${e.text} ${e.place}`);
    let score = 0;
    for (const t of terms) {
      if (title.includes(t)) score += 3;
      else if (title.some((w) => w.startsWith(t))) score += 2;
      else if (body.some((w) => w === t || w.startsWith(t))) score += 1;
      else {
        score = 0;
        break;
      }
    }
    if (score > 0) hits.push({ ...e, score });
  }
  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, most);
}
