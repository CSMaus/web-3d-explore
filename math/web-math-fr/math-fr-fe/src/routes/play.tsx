import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Text, Button, Heading, Page, Panel } from "@kit/index";
import { SYSTEMS as CHAOS_PAGES } from "@/lib/chaos";
import { SYSTEMS as COMPLEX_PAGES } from "@/lib/complex";
import { SYSTEMS as NETWORK_PAGES } from "@/lib/networks";
import { SYSTEMS as PRIMES_PAGES } from "@/lib/primes";
import { SYSTEMS as FRACTAL_PAGES } from "@/lib/systems";
import { SYSTEMS as TOKEN_PAGES } from "@/lib/tokens";
import { BUILT } from "@/lib/topic";

export const Route = createFileRoute("/play")({
  component: Play,
});

const PAGES = {
  complex: COMPLEX_PAGES,
  fractals: FRACTAL_PAGES,
  chaos: CHAOS_PAGES,
  networks: NETWORK_PAGES,
  tokens: TOKEN_PAGES,
  primes: PRIMES_PAGES,
} as const;

/** every interactive page on the site, by topic, in reading order. */
function Play() {
  const { t } = useTranslation();
  const topics = Object.values(BUILT).sort((a, b) => a.number - b.number);
  return (
    <Page>
      <Heading>{t("play.heading")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">{t("play.lede")}</Text>
      <div className="mt-8 space-y-4">
        {topics.map((topic) => {
          const pages = PAGES[topic.slug as keyof typeof PAGES];
          return (
            <Panel key={topic.slug} label={topic.number === 0 ? `Start here · ${topic.title}` : `Topic ${topic.number} · ${topic.title}`}>
              <ul className="flex flex-wrap gap-2">
                {pages.map((p) => (
                  <li key={p.to}>
                    <Button variant="outline" asChild>
                      <Link to={p.to}>{p.label}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
      </div>
    </Page>
  );
}
