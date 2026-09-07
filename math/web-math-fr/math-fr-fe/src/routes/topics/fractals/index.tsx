import { createFileRoute, redirect } from "@tanstack/react-router";

/** a topic with no section named is its series. */
export const Route = createFileRoute("/topics/fractals/")({
  loader: () => {
    throw redirect({ to: "/topics/fractals/parts" });
  },
});
