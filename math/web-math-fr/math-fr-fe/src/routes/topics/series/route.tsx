import { createFileRoute } from "@tanstack/react-router";
import { TopicLayout } from "@/components/TopicLayout";
import { SERIES } from "@/lib/series";

export const Route = createFileRoute("/topics/series")({
  component: () => <TopicLayout topic={SERIES} />,
});
