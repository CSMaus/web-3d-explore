import { createFileRoute, redirect } from "@tanstack/react-router";
import { REPLACED } from "@/lib/networks";

/**
 * this page was rejected and remade under another name. the address is kept
 * so a saved link still lands somewhere, and it goes straight to the
 * replacement.
 */
export const Route = createFileRoute("/topics/networks/play/perceptron")({
  beforeLoad: () => {
    throw redirect({ to: REPLACED.perceptron });
  },
});
