import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Text, Button, Heading, Page, Panel } from "@kit/index";
import { PROJECTS } from "@/content/projects";

export const Route = createFileRoute("/projects/")({
  component: Projects,
});

function Projects() {
  const { t } = useTranslation();
  return (
    <Page>
      <Heading>{t("projects.heading")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">{t("projects.lede")}</Text>
      <ol className="mt-8 grid gap-4 md:grid-cols-2">
        {PROJECTS.map((p) => (
          <li key={p.slug}>
            <Panel className="h-full">
              <div data-text="itemTitle">{p.title}</div>
              <Text kind="intro" as="p" className="mt-2">{p.summary}</Text>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link to="/projects/$slug" params={{ slug: p.slug }}>
                    {t("projects.open")}
                  </Link>
                </Button>
              </div>
            </Panel>
          </li>
        ))}
      </ol>
    </Page>
  );
}
