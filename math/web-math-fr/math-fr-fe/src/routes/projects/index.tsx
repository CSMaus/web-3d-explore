import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Text, Heading, Page, Tag } from "@kit/index";
import { FIGURES } from "@/components/projects";
import { PROJECTS } from "@/content/projects";

export const Route = createFileRoute("/projects/")({
  component: Projects,
});

/** every project as a card that moves: its figure running, its name, one sentence, what it is built with */
function Projects() {
  const { t } = useTranslation();
  return (
    <Page>
      <Heading>{t("projects.heading")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">{t("projects.lede")}</Text>
      <ol className="mt-8 grid gap-5 md:grid-cols-2">
        {PROJECTS.map((p) => {
          const Thumb = FIGURES[p.slug]?.Thumb;
          return (
            <li key={p.slug} className="min-w-0">
              <Link to="/projects/$slug" params={{ slug: p.slug }} data-tile="" className="group h-full flex-col gap-3">
                <div className="aspect-[16/8] w-full overflow-hidden rounded-md">{Thumb ? <Thumb /> : null}</div>
                <span className="flex items-baseline justify-between gap-2">
                  <span data-text="itemTitle">{p.title}</span>
                  <span aria-hidden="true" className="text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
                </span>
                <Text kind="note" as="span" className="block">{p.summary}</Text>
                <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {p.stack.slice(0, 4).map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Page>
  );
}
