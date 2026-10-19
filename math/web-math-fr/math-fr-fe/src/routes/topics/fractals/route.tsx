import { createFileRoute } from "@tanstack/react-router";
import { TopicLayout } from "@/components/TopicLayout";
import { FRACTALS } from "@/lib/topic";

export const Route = createFileRoute("/topics/fractals")({
  component: () => <TopicLayout topic={FRACTALS} />,
});
