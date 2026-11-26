import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/topics/series/")({
  loader: () => {
    throw redirect({ to: "/topics/series/play" });
  },
});
