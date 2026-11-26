import { createFileRoute } from "@tanstack/react-router";
import { Quiz } from "@/components/Quiz";

export const Route = createFileRoute("/topics/primes/test")({
  component: () => <Quiz slug="primes" />,
});
