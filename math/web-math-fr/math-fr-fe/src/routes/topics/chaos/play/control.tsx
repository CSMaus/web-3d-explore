import { createFileRoute, redirect } from "@tanstack/react-router";

// the page moved from play to applications; the old address still arrives
export const Route = createFileRoute("/topics/chaos/play/control")({
  beforeLoad: () => {
    throw redirect({ to: "/topics/chaos/uses/control" });
  },
});
