import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/topics/networks/")({
  loader: () => {
    throw redirect({ to: "/topics/networks/play" });
  },
});
