import { createFileRoute } from "@tanstack/react-router";
import { TopicLayout } from "@/components/TopicLayout";
import { CHAOS } from "@/lib/chaos";

export const Route = createFileRoute("/topics/chaos")({
  component: () => <TopicLayout topic={CHAOS} />,
});
