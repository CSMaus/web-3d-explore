import { createFileRoute } from "@tanstack/react-router";
import { UsesIndex } from "@/components/UsesIndex";
import { FRACTALS } from "@/lib/topic";

export const Route = createFileRoute("/topics/fractals/uses/")({
  component: () => <UsesIndex topic={FRACTALS} />,
});
