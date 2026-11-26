import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/topics/probability/")({
  loader: () => {
    throw redirect({ to: "/topics/probability/play" });
  },
});
