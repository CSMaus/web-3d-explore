import { createFileRoute } from "@tanstack/react-router";
import { UsesIndex } from "@/components/UsesIndex";
import { SERIES } from "@/lib/series";

export const Route = createFileRoute("/topics/series/uses/")({
  component: () => <UsesIndex topic={SERIES} />,
});
