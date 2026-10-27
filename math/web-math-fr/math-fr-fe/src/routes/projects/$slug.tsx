import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { TextLink, Text, Button, Label, Page, Panel, Tag } from "@kit/index";
import { FIGURES } from "@/components/projects";
import { Stage } from "@/components/projects/Stage";
import { projectAt } from "@/content/projects";
import { L } from "@/lib/lang";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const project = projectAt(params.slug);
    if (!project) throw notFound();
    return project;
  },
  component: Project,
});

/** a block that rises into view as it reaches the screen */
function Rising({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRise<HTMLDivElement>(120);
  return (
    <div ref={ref} className={`rise ${className ?? ""}`}>
      {children}
    </div>
  );
}

/**
 * a project shown rather than told: its figure to try, its numbers, then how it works in a few
 * steps, each a sentence or two beside its own moving figure.
 */
function Project() {
  const { t } = useTranslation();
  const project = Route.useLoaderData();
  const figures = FIGURES[project.slug];
  const Hero = figures?.Hero;
  const outside = project.link && /^https?:/.test(project.link.to);
  return (
    <Page>
      <TextLink asChild>
        <Link to="/projects">← {t("projects.back")}</Link>
      </TextLink>
      {/* the opening: the name large and alone in the middle, one line under it */}
      <div className="mx-auto mt-12 max-w-3xl text-center">
        <h1 data-text="display" className="m-0" style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)", lineHeight: 1.08 }}>{project.title}</h1>
        <Text kind="intro" as="p" className="mx-auto mt-5 max-w-2xl">{project.summary}</Text>
      </div>

      {/* the main facts, right under the name, where they are read first */}
      {project.facts?.length ? (
      <dl className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
        {project.facts.map((f) => (
          <div key={f.label} className="min-w-0 border-l pl-4" style={{ borderColor: "var(--c-border)" }}>
            <dd data-text="display" className="m-0 tabular-nums" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", lineHeight: 1.1, color: "var(--c-value)" }}>{f.value}</dd>
            <dt data-text="note" className="mt-1">{f.label}</dt>
          </div>
        ))}
      </dl>
      ) : null}

      {Hero ? (
        <Rising className="mt-12">
          <Panel>
            <Hero />
            <Text kind="note" as="p" className="mt-4 max-w-3xl">{project.hero}</Text>
          </Panel>
        </Rising>
      ) : null}

      <section className="mt-14">
        <Label>{L("How it works")}</Label>
        <div className="mt-6">
          <Stage steps={project.steps} figures={figures?.steps ?? {}} />
        </div>
        {project.more ? <Text kind="body" as="p" className="mt-10 max-w-3xl">{project.more}</Text> : null}
      </section>

      <section className="mt-12 flex flex-wrap items-center gap-4">
        <span className="flex flex-wrap gap-1.5">
          {project.stack.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </span>
        {project.link ? (
          <Button variant="outline" asChild className="ml-auto">
            {outside ? (
              <a href={project.link.to} target="_blank" rel="noopener noreferrer">{project.link.label} ↗</a>
            ) : (
              <Link to={project.link.to}>{project.link.label}</Link>
            )}
          </Button>
        ) : null}
      </section>
    </Page>
  );
}
