import { createFileRoute } from "@tanstack/react-router";
import { TopicLayout } from "@/components/TopicLayout";
import { PRIMES } from "@/lib/primes";

export const Route = createFileRoute("/topics/primes")({
  component: () => <TopicLayout topic={PRIMES} />,
});
