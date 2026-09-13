import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/topics/complex/")({
  loader: () => {
    throw redirect({ to: "/topics/complex/play" });
  },
});
