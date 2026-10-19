import { createFileRoute } from "@tanstack/react-router";
import { TopicLayout } from "@/components/TopicLayout";
import { COMPLEX } from "@/lib/complex";

export const Route = createFileRoute("/topics/complex")({
  component: () => <TopicLayout topic={COMPLEX} />,
});
