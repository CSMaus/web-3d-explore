import { createFileRoute } from "@tanstack/react-router";
import { UsesIndex } from "@/components/UsesIndex";
import { TOKENS } from "@/lib/tokens";

export const Route = createFileRoute("/topics/tokens/uses/")({
  component: () => <UsesIndex topic={TOKENS} />,
});
