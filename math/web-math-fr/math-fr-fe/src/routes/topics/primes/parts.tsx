import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/primes/parts")({
  component: PrimesParts,
});

function PrimesParts() {
  return (
    <div>
      <Heading level={1} className="mt-6">{L("No video parts")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("Some topics on this site come with a video series, and this tab lists its parts. This topic is a single page, and no video is planned for it. The page itself, with its pictures and controls, is under the Play tab. The formulas it uses, with every letter explained, are under the Mathematics tab.")}
      </Text>
    </div>
  );
}
