import { createFileRoute } from "@tanstack/react-router";
import { UsesIndex } from "@/components/UsesIndex";
import { NETWORKS } from "@/lib/networks";

export const Route = createFileRoute("/topics/networks/uses/")({
  component: () => <UsesIndex topic={NETWORKS} />,
});
