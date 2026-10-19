import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Text, Badge, Button, Heading, Page, Panel } from "@kit/index";
import { api } from "@/lib/api";
import { BUILT } from "@/lib/topic";

export const Route = createFileRoute("/learn")({
  loader: () => api.topics(),
  component: Learn,
});

/** the series of every topic, in reading order. */
function Learn() {
  const { t } = useTranslation();
  const cards = Route.useLoaderData();
  const topics = Object.values(BUILT)
    .filter((b) => b.slug !== "primes")
    .sort((a, b) => a.number - b.number);
  return (
    <Page>
      <Heading>{t("learn.heading")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">{t("learn.lede")}</Text>
      <ol className="mt-8 space-y-4">
        {topics.map((topic) => {
          const card = cards?.find((c) => c.slug === topic.slug);
          const parts = topic.sections.find((s) => s.label === "Parts");
          return (
            <li key={topic.slug}>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div data-text="itemTitle">
                      {topic.number === 0 ? "Start here" : `Topic ${topic.number}`} · {topic.title}
                    </div>
                    {card ? (
                      <Text kind="caption" as="p" className="mt-1">
                        {card.parts > 0 ? `${card.parts} parts, ${card.beats} beats, about ${Math.round(card.seconds / 60)} minutes` : "No clip filmed yet"}
                      </Text>
                    ) : null}
                  </div>
                  {card ? <Badge variant="outline">{t(`state.${card.state}`)}</Badge> : null}
                </div>
                {card?.summary ? <Text kind="intro" as="p" className="mt-2 max-w-3xl">{card.summary}</Text> : null}
                {parts ? (
                  <div className="mt-4">
                    <Button variant="outline" asChild>
                      <Link to={parts.to}>{t("learn.open")}</Link>
                    </Button>
                  </div>
                ) : null}
              </Panel>
            </li>
          );
        })}
      </ol>
    </Page>
  );
}
