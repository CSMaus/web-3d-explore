import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TextLink, Text, Button, Heading, Page } from "@kit/index";
import { projectAt } from "@/content/projects";

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const project = projectAt(params.slug);
    if (!project) throw notFound();
    return project;
  },
  component: Project,
});

function Project() {
  const { t } = useTranslation();
  const project = Route.useLoaderData();
  return (
    <Page>
      <TextLink asChild>
        <Link to="/projects">← {t("projects.back")}</Link>
      </TextLink>
      <Heading className="mt-4">{project.title}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">{project.summary}</Text>
      <div className="mt-8 max-w-2xl space-y-4">
        {project.body.map((p, i) => (
          <Text kind="body" as="p" key={i}>{p}</Text>
        ))}
      </div>
      {project.link ? (
        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link to={project.link.to}>{project.link.label}</Link>
          </Button>
        </div>
      ) : null}
    </Page>
  );
}
