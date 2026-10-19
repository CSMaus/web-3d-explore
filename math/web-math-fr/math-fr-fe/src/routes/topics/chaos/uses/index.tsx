import { createFileRoute } from "@tanstack/react-router";
import { UsesIndex } from "@/components/UsesIndex";
import { CHAOS } from "@/lib/chaos";

export const Route = createFileRoute("/topics/chaos/uses/")({
  component: () => <UsesIndex topic={CHAOS} />,
});
