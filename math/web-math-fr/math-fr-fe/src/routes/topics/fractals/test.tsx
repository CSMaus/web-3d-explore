import { createFileRoute } from "@tanstack/react-router";
import { Quiz } from "@/components/Quiz";

export const Route = createFileRoute("/topics/fractals/test")({
  component: () => <Quiz slug="fractals" />,
});
