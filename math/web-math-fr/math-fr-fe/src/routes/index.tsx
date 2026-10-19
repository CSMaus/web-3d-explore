import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge, Button, Heading, Page, Panel, Separator, Text } from "@kit/index";
import { FrontHero } from "@/components/FrontHero";
import { api, type Card } from "@/lib/api";
import { BUILT, builtAt } from "@/lib/topic";

export const Route = createFileRoute("/")({
  loader: () => api.topics(),
  component: Front,
});

/** the topics as the front page knows them without the backend: title and where to open. */
const LOCAL: Card[] = Object.values(BUILT)
  .filter((t) => t.slug !== "primes")
  .map((t) => ({ slug: t.slug, number: t.number, title: t.title, summary: "", state: "writing", parts: 0, beats: 0, seconds: 0, systems: 0 }));

function Front() {
  const { t } = useTranslation();
  const topics = (Route.useLoaderData() ?? LOCAL).filter((c) => !c.aside).sort((a, b) => a.number - b.number);

  return (
    <Page className="pt-32">
      <FrontHero />
      <Separator className="mt-16" />

      <section className="mt-20">
        <Heading level={2}>{t("front.topicsHeading")}</Heading>
        <Text kind="intro" as="p" className="mt-3 max-w-2xl">{t("front.topicsLede")}</Text>
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {topics.map((topic) => {
            const built = builtAt(topic.slug);
            return (
              <li key={topic.slug}>
                <Panel className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div data-text="itemTitle">
                      {topic.number === 0 ? "Start here" : `Topic ${topic.number}`} · {topic.title}
                    </div>
                    <Badge variant="outline">{t(`state.${topic.state}`)}</Badge>
                  </div>
                  {topic.summary ? <Text kind="intro" as="p" className="mt-2">{topic.summary}</Text> : null}
                  {built ? (
                    <div className="mt-4">
                      <Button variant="outline" asChild>
                        <Link to={built.landing}>{t("front.openTopic")}</Link>
                      </Button>
                    </div>
                  ) : null}
                </Panel>
              </li>
            );
          })}
        </ol>
      </section>
    </Page>
  );
}
