import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";

export const Route = createFileRoute("/topics/primes/parts")({
  component: PrimesParts,
});

function PrimesParts() {
  return (
    <div>
      <Heading level={1} className="mt-6">No series</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        This is an aside to topic 2, one page long, and no clips are planned for it. The page is
        under Play; the two equations it rests on are under Mathematics.
      </Text>
    </div>
  );
}
