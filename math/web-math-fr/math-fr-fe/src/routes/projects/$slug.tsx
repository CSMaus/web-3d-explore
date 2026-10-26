import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TextLink, Text, Button, Heading, Label, Page, Panel, Tag } from "@kit/index";
import { FIGURES } from "@/components/projects";
import { projectAt } from "@/content/projects";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const project = projectAt(params.slug);
    if (!project) throw notFound();
    return project;
  },
  component: Project,
});

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
      <Heading className="mt-4">{project.title}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-3xl">{project.summary}</Text>

      {Hero ? (
        <Panel className="mt-8">
          <Hero />
          <Text kind="note" as="p" className="mt-4 max-w-3xl">{project.hero}</Text>
        </Panel>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
        {project.facts.map((f) => (
          <div key={f.label} className="min-w-0 border-l pl-4" style={{ borderColor: "var(--c-border)" }}>
            <dd data-text="display" className="m-0 tabular-nums" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", lineHeight: 1.1, color: "var(--c-value)" }}>{f.value}</dd>
            <dt data-text="note" className="mt-1">{f.label}</dt>
          </div>
        ))}
      </dl>

      <section className="mt-14">
        <Label>{L("How it works")}</Label>
        <ol className="mt-6 space-y-10">
          {project.steps.map((s, i) => {
            const Figure = figures?.steps[s.figure];
            return (
              <li key={s.figure} className={`grid items-center gap-5 ${i % 2 ? "md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : "md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"}`}>
                <div className={i % 2 ? "md:order-2" : undefined}>
                  <span data-text="label" className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <Heading level={3} className="mt-1">{s.title}</Heading>
                  <Text kind="body" as="p" className="mt-2">{s.text}</Text>
                </div>
                <div data-slot="plot" className="min-w-0 overflow-hidden">{Figure ? <Figure /> : null}</div>
              </li>
            );
          })}
        </ol>
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
