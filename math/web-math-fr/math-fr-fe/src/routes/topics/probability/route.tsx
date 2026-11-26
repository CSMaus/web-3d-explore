import { createFileRoute } from "@tanstack/react-router";
import { TopicLayout } from "@/components/TopicLayout";
import { PROBABILITY } from "@/lib/probability";

export const Route = createFileRoute("/topics/probability")({
  component: () => <TopicLayout topic={PROBABILITY} />,
});
