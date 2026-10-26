import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Text, Heading, Page, Readout } from "@kit/index";
import { CHANNELS } from "@/content/contact";

export const Route = createFileRoute("/contact")({
  component: Contact,
});

function Contact() {
  const { t } = useTranslation();
  return (
    <Page>
      <Heading>{t("contact.heading")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">{t("contact.lede")}</Text>
      <div className="mt-8 max-w-xl">
        {CHANNELS.length === 0 ? (
          <Text kind="intro" as="p">{t("contact.none")}</Text>
        ) : (
          <Readout rows={CHANNELS.map((c) => [c.label, c.href ? <a key={c.label} data-slot="link" href={c.href} target="_blank" rel="noopener noreferrer">{c.value}</a> : c.value])} />
        )}
      </div>
    </Page>
  );
}
