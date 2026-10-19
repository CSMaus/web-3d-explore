import { createFileRoute } from "@tanstack/react-router";
import { TopicLayout } from "@/components/TopicLayout";
import { TOKENS } from "@/lib/tokens";

export const Route = createFileRoute("/topics/tokens")({
  component: () => <TopicLayout topic={TOKENS} />,
});
