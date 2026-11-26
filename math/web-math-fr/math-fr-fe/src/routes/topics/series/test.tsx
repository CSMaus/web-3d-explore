import { createFileRoute } from "@tanstack/react-router";
import { Quiz } from "@/components/Quiz";

export const Route = createFileRoute("/topics/series/test")({
  component: () => <Quiz slug="series" />,
});
