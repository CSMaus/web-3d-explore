import { createFileRoute } from "@tanstack/react-router";
import { TopicLayout } from "@/components/TopicLayout";
import { NETWORKS } from "@/lib/networks";

export const Route = createFileRoute("/topics/networks")({
  component: () => <TopicLayout topic={NETWORKS} />,
});
