import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Heading, Page, Text } from "@kit/index";
import { FrontHero } from "@/components/FrontHero";
import { FrontScene } from "@/components/FrontScene";
import { TopicGraph } from "@/components/TopicGraph";
import { api, type Card } from "@/lib/api";
import { FRONT_LAYOUT } from "@/lib/site";
import { BUILT } from "@/lib/topic";

export const Route = createFileRoute("/")({
  loader: () => api.topics(),
  component: Front,
});

/** the topics as the front page knows them without the backend: title and where to open. */
const LOCAL: Card[] = Object.values(BUILT)
  .filter((t) => t.slug !== "primes")
  .sort((a, b) => a.number - b.number)
  .map((t) => ({ slug: t.slug, number: t.number, title: t.title, summary: "", state: "writing", parts: 0, beats: 0, seconds: 0, systems: 0 }));

/**
 * the front page: the Mandelbulb and the words on the first screen, then the topics as a
 * graph in reading order. `FRONT_LAYOUT` in lib/site.ts picks between the two first screens
 * made so far; the graph is the same under both.
 */
function Front() {
  const { t } = useTranslation();
  const topics = (Route.useLoaderData() ?? LOCAL).filter((c) => !c.aside).sort((a, b) => a.number - b.number);
  const scene = FRONT_LAYOUT === "scene";

  return (
    <Page className={scene ? "pt-24" : "pt-32"}>
      {scene ? <FrontScene /> : <FrontHero />}

      <section className={scene ? "mt-16 pb-16" : "mt-24 pb-16"}>
        <Heading level={2}>{t("front.topicsHeading")}</Heading>
        <Text kind="intro" as="p" className="mt-3 max-w-2xl">{t("front.topicsLede")}</Text>
        <div className="mt-12">
          <TopicGraph topics={topics} />
        </div>
      </section>
    </Page>
  );
}
