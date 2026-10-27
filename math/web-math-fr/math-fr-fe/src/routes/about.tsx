import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Choices, Heading, Page, Text, TextLink } from "@kit/index";
import { EDUCATION, NAME, PAPERS, PROFILES, REGISTERED, SUMMARY, WORK } from "@/content/about";
import { L } from "@/lib/lang";

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

/** the owner's name in a list of authors, set apart */
function Authors({ list }: { list: string }) {
  const parts = list.split(NAME);
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 ? <strong className="font-medium text-foreground">{NAME}</strong> : null}
        </Fragment>
      ))}
    </>
  );
}

/**
 * who makes the site: the name, one line, the three public profiles, then the work, the education,
 * the papers and the registered software, with a row of chips held under the bar that marks the
 * part in view and scrolls to another.
 */
function About() {
  const { t } = useTranslation();
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

  const go = (id: Part) => {
    setHere(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const anchored = { scrollMarginTop: "calc(var(--topbar-height) + 72px)" };

  return (
    <Page>
      <Heading>{t("about.heading")}</Heading>
      <p data-text="itemTitle" className="mt-6" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>{NAME}</p>
      <Text kind="intro" as="p" className="mt-2 max-w-2xl">{SUMMARY}</Text>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {PROFILES.map((p) => (
          <TextLink key={p.label} asChild>
            <a href={p.href} target="_blank" rel="noopener noreferrer">{p.label} ↗</a>
          </TextLink>
        ))}
      </div>

      <div
        className="sticky top-[var(--topbar-height)] z-10 mt-8 py-3"
        style={{ borderImage: "linear-gradient(color-mix(in oklab, var(--c-background) 92%, transparent) 0 0) fill 0 / / 0 100vmax" }}
      >
        <Choices options={PARTS.map((p) => ({ id: p.id, label: p.label }))} value={here} onPick={go} />
      </div>

      <section id="experience" className="mt-8" style={anchored}>
        <Heading level={2}>{L("Experience")}</Heading>
        <ol className="mt-6 space-y-10">
          {WORK.map((job) => (
            <li key={job.when} className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
              <span data-text="label" className="tabular-nums">{job.when}</span>
              <div className="min-w-0">
                <div data-text="itemTitle">{job.role}</div>
                <Text kind="note" as="div" className="mt-1">
                  {job.place}
                  {job.what ? ` · ${job.what}` : ""}
                </Text>
                <ul data-text="body" className="mt-3 max-w-3xl list-disc space-y-2 pl-5">
                  {job.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="education" className="mt-16" style={anchored}>
        <Heading level={2}>{L("Education")}</Heading>
        <ol className="mt-6 space-y-6">
          {EDUCATION.map((e) => (
            <li key={e.when} className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
              <span data-text="label" className="tabular-nums">{e.when}</span>
              <div className="min-w-0">
                <div data-text="itemTitle">{e.degree}</div>
                <Text kind="note" as="div" className="mt-1">{e.place}</Text>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="papers" className="mt-16" style={anchored}>
        <Heading level={2}>{L("Papers")}</Heading>
        <ol className="mt-6 space-y-8">
          {PAPERS.map((p) => (
            <li key={p.doi} className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
              <span data-text="label" className="tabular-nums">{p.year}</span>
              <div className="min-w-0 max-w-3xl">
                <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" data-text="itemTitle" className="hover:underline">
                  {p.title} ↗
                </a>
                <Text kind="note" as="div" className="mt-1">
                  <Authors list={p.authors} />
                </Text>
                <Text kind="note" as="div" className="mt-1 italic">{p.venue}</Text>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="software" className="mt-16 pb-12" style={anchored}>
        <Heading level={2}>{L("Registered software")}</Heading>
        <Text kind="note" as="p" className="mt-2 max-w-2xl">{L("Computer programs registered in Korea, with their registration numbers.")}</Text>
        <ol className="mt-6 space-y-8">
          {REGISTERED.map((r) => (
            <li key={r.number} className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
              <span data-text="label" className="tabular-nums">{r.date}</span>
              <div className="min-w-0 max-w-3xl">
                <div data-text="itemTitle" lang="ko">{r.title}</div>
                <Text kind="note" as="div" className="mt-1">{r.english}</Text>
                <Text kind="note" as="div" className="mt-1">
                  <Authors list={r.authors} />
                </Text>
                <div data-text="caption" className="mt-1 tabular-nums">{r.number}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </Page>
  );
}
