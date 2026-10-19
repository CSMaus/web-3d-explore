import { createFileRoute } from "@tanstack/react-router";
import { UsesIndex } from "@/components/UsesIndex";
import { COMPLEX } from "@/lib/complex";

export const Route = createFileRoute("/topics/complex/uses/")({
  component: () => <UsesIndex topic={COMPLEX} />,
});
