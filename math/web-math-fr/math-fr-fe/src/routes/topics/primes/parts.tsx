import { createFileRoute } from "@tanstack/react-router";
import { TopicBar } from "@/components/TopicBar";
import { PRIMES } from "@/lib/primes";

export const Route = createFileRoute("/topics/primes/parts")({
  component: PrimesParts,
});

function PrimesParts() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
      <TopicBar topic={PRIMES} />
      <h1 className="mt-6 font-mono text-sm tracking-wide text-leaf">No series</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        This is an aside to topic 2, one page long, and no clips are planned for it. The page is
        under Play; the two equations it rests on are under Mathematics.
      </p>
    </main>
  );
}
