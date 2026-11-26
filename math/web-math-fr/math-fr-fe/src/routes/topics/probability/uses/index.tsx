import { createFileRoute } from "@tanstack/react-router";
import { UsesIndex } from "@/components/UsesIndex";
import { PROBABILITY } from "@/lib/probability";

export const Route = createFileRoute("/topics/probability/uses/")({
  component: () => <UsesIndex topic={PROBABILITY} />,
});
