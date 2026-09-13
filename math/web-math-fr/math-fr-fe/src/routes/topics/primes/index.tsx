import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/topics/primes/")({
  loader: () => {
    throw redirect({ to: "/topics/primes/play/gaps" });
  },
});
