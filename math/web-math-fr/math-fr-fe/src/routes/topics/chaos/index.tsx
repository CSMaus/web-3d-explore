import { createFileRoute, redirect } from "@tanstack/react-router";

/** the clips are not made yet, so a topic with no section named goes to its pages. */
export const Route = createFileRoute("/topics/chaos/")({
  loader: () => {
    throw redirect({ to: "/topics/chaos/play" });
  },
});
