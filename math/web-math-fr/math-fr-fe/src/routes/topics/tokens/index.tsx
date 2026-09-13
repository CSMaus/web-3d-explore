import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/topics/tokens/")({
  loader: () => {
    throw redirect({ to: "/topics/tokens/play" });
  },
});
