import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Text, Heading, Page } from "@kit/index";
import { ABOUT } from "@/content/about";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  const { t } = useTranslation();
  return (
    <Page>
      <Heading>{t("about.heading")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">{t("about.lede")}</Text>
      <div className="mt-8 max-w-2xl space-y-4">
        {ABOUT.intro.map((p, i) => (
          <Text kind="body" as="p" key={i}>{p}</Text>
        ))}
      </div>
      {ABOUT.sections.map((s) => (
        <section key={s.title} className="mt-10 max-w-2xl">
          <Heading level={2}>{s.title}</Heading>
          <div className="mt-3 space-y-3">
            {s.body.map((p, i) => (
              <Text kind="body" as="p" key={i}>{p}</Text>
            ))}
          </div>
        </section>
      ))}
    </Page>
  );
}
