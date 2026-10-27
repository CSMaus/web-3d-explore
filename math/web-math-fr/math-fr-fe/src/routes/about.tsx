import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Choices, Page, Text, TextLink } from "@kit/index";
import { EDUCATION, NAME, PAPERS, PROFILES, REGISTERED, SUMMARY, WORK } from "@/content/about";
import { L } from "@/lib/lang";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/about")({
  component: About,
});

const PARTS = [
  { id: "experience", label: L("Experience") },
  { id: "education", label: L("Education") },
  { id: "papers", label: L("Papers") },
  { id: "software", label: L("Registered software") },
] as const;

type Part = (typeof PARTS)[number]["id"];

/** the dates in the theme's primary colour, as the labels of Cool have it, so every theme carries its accent here */
const ACCENT = { color: "var(--c-primary)" };

/** a part of the page that rises into view as it reaches the screen */
function Rise({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRise<HTMLLIElement>(delay);
  return (
    <li ref={ref} className={`rise ${className ?? ""}`}>
      {children}
    </li>
  );
}

/** the owner's name in a list of authors, set apart in the theme's primary colour so it never reads as part of the title */
function Authors({ list }: { list: string }) {
  const parts = list.split(NAME);
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 ? <strong className="font-medium" style={ACCENT}>{NAME}</strong> : null}
        </Fragment>
      ))}
    </>
  );
}

/**
 * one part of the page: a thin line that fades out at both ends, room above it, and the part's
 * name large, so the parts stay apart without boxes round them
 */
function Part({ id, title, note, children }: { id: Part; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="pt-20 md:pt-28" style={{ scrollMarginTop: "calc(var(--topbar-height) + 40px)" }}>
      <div aria-hidden="true" className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, var(--c-border) 12%, var(--c-border) 88%, transparent)" }} />
      <h2 data-text="display" className="m-0 mt-10 md:mt-14" style={{ fontSize: "clamp(1.9rem, 4.5vw, 3.2rem)", lineHeight: 1.08 }}>{title}</h2>
      {note ? <Text kind="note" as="p" className="mt-3 max-w-2xl">{note}</Text> : null}
      {children}
    </section>
  );
}

/** the items of a part, each set off from the next by a faint line */
const ITEMS = "mt-8 divide-y divide-[color-mix(in_oklab,var(--c-border)_55%,transparent)] md:mt-10 [&>li]:py-8 md:[&>li]:py-10 [&>li:first-child]:pt-0";

/**
 * who makes the site: an opening alone on the screen with the name as the heading, one line, the
 * three public profiles and the two main numbers; then a row of chips held under the bar that marks the part in
 * view and scrolls to another; then the work, the education, the papers and the registered
 * software, one part after another.
 */
function About() {
  const [here, setHere] = useState<Part>("experience");

  useEffect(() => {
    const watch = new IntersectionObserver(
      (seen) => {
        const top = seen.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setHere(top.target.id as Part);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    for (const p of PARTS) {
      const el = document.getElementById(p.id);
      if (el) watch.observe(el);
    }
    return () => watch.disconnect();
  }, []);

  // on a narrow screen the row scrolls sideways; the lit chip is kept in it
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = row.current;
    const lit = box?.querySelector<HTMLElement>('[data-state="on"]');
    if (!box || !lit || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({ left: lit.offsetLeft - 16, behavior: "smooth" });
  }, [here]);

  const go = (id: Part) => {
    setHere(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Page>
      {/* the opening: one idea on the screen, centred, with room round it */}
      <div className="mx-auto flex min-h-[calc(78svh_-_var(--topbar-height))] max-w-3xl flex-col items-center justify-center py-10 text-center">
        {/* the name is the heading: the tab in the bar already says what the page is. its size follows
            the theme's display size, the size of the front page's slogan: six tenths of it, at least
            36 px (the pixel slogan is small), never more than nine tenths, and a narrow screen makes it
            smaller still, so it never outgrows the slogan */}
        <div data-text="display" style={{ lineHeight: 1.08 }}>
          <h1 className="m-0" style={{ fontSize: "min(max(0.6em, 36px), 0.9em, 7vw)", lineHeight: "inherit" }}>{NAME}</h1>
        </div>
        <Text kind="intro" as="p" className="mx-auto mt-6 max-w-xl">{SUMMARY}</Text>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {PROFILES.map((p) => (
            <TextLink key={p.label} asChild>
              <a href={p.href} target="_blank" rel="noopener noreferrer">{p.label} ↗</a>
            </TextLink>
          ))}
        </div>
        <dl className="m-0 mt-14 flex justify-center gap-x-14 md:gap-x-24">
          {[
            { value: "5+", label: L("years") },
            { value: String(REGISTERED.length), label: L("patents") },
          ].map((f) => (
            <div key={f.label} className="flex min-w-0 flex-col-reverse items-center">
              <dt data-text="note" className="mt-2">{f.label}</dt>
              <dd data-text="display" className="m-0 tabular-nums" style={{ fontSize: "clamp(2.6rem, 7vw, 4rem)", lineHeight: 1, color: "var(--c-value)" }}>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* the chips, held under the bar on a solid ground that reaches both edges of the screen; on a
          phone one row that scrolls sideways */}
      <div
        ref={row}
        className="sticky top-[var(--topbar-height)] z-10 -mx-4 overflow-x-auto px-4 py-3 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
        style={{ background: "var(--c-background)", boxShadow: "0 0 0 100vmax var(--c-background)", clipPath: "inset(0 -100vmax)" }}
      >
        <Choices className="w-max flex-nowrap" options={PARTS.map((p) => ({ id: p.id, label: p.label }))} value={here} onPick={go} />
      </div>

      <Part id="experience" title={L("Experience")}>
        <ol className={ITEMS}>
          {WORK.map((job) => (
            <Rise key={job.when} className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)] md:gap-10">
              {/* the dates and the role stay in view beside the work while it scrolls past */}
              <div className="min-w-0 md:sticky md:top-[calc(var(--topbar-height)_+_84px)] md:self-start">
                <span data-text="label" className="tabular-nums" style={ACCENT}>{job.when}</span>
                <div data-text="itemTitle" className="mt-1">{job.role}</div>
                <Text kind="note" as="div" className="mt-1">
                  {job.place}
                  {job.what ? ` · ${job.what}` : ""}
                </Text>
              </div>
              <ul data-text="body" className="min-w-0 max-w-3xl list-disc space-y-3 pl-5">
                {job.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Rise>
          ))}
        </ol>
      </Part>

      <Part id="education" title={L("Education")}>
        <ol className={ITEMS}>
          {EDUCATION.map((e) => (
            <Rise key={e.when} className="grid gap-2 md:grid-cols-[260px_minmax(0,1fr)] md:gap-10">
              <span data-text="label" className="tabular-nums" style={ACCENT}>{e.when}</span>
              <div className="min-w-0">
                <div data-text="itemTitle">{e.degree}</div>
                <Text kind="note" as="div" className="mt-1">{e.place}</Text>
              </div>
            </Rise>
          ))}
        </ol>
      </Part>

      <Part id="papers" title={L("Papers")}>
        <ol className={ITEMS}>
          {PAPERS.map((p) => (
            <Rise key={p.href} className="grid gap-2 md:grid-cols-[260px_minmax(0,1fr)] md:gap-10">
              <span data-text="label" className="tabular-nums" style={ACCENT}>{p.year}</span>
              <div className="min-w-0 max-w-3xl">
                <a href={p.href} target="_blank" rel="noopener noreferrer" data-text="itemTitle" className="hover:underline">
                  {p.title} ↗
                </a>
                <Text kind="note" as="div" className="mt-1">
                  <Authors list={p.authors} />
                </Text>
                <Text kind="note" as="div" className="mt-1 italic">{p.venue}</Text>
                {p.doi ? <div data-text="caption" className="mt-1">DOI {p.doi}</div> : null}
              </div>
            </Rise>
          ))}
        </ol>
      </Part>

      <Part id="software" title={L("Registered software")} note={L("Computer programs registered in Korea, with their registration numbers.")}>
        <ol className={`${ITEMS} pb-12`}>
          {REGISTERED.map((r) => (
            <Rise key={r.number} className="grid gap-2 md:grid-cols-[260px_minmax(0,1fr)] md:gap-10">
              <span data-text="label" className="tabular-nums" style={ACCENT}>{r.date}</span>
              <div className="min-w-0 max-w-3xl">
                <div data-text="itemTitle" lang="ko">{r.title}</div>
                <Text kind="note" as="div" className="mt-1">{r.english}</Text>
                <Text kind="note" as="div" className="mt-1">
                  <Authors list={r.authors} />
                </Text>
                <div data-text="caption" className="mt-1 tabular-nums">{r.number}</div>
              </div>
            </Rise>
          ))}
        </ol>
      </Part>
    </Page>
  );
}
