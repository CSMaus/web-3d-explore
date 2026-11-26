import { createFileRoute } from "@tanstack/react-router";
import { Quiz } from "@/components/Quiz";

export const Route = createFileRoute("/topics/complex/test")({
  component: () => <Quiz slug="complex" />,
});
