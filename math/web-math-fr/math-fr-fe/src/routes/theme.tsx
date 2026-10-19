import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// the builder exists only in development. in a build this branch is constant
// false, the import is dropped, and the address sends the reader home.
const Builder = import.meta.env.DEV ? lazy(() => import("@/theme/Builder")) : () => null;

export const Route = createFileRoute("/theme")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw redirect({ to: "/" });
  },
  component: ThemeRoute,
});

function ThemeRoute() {
  return (
    <Suspense fallback={null}>
      <Builder />
    </Suspense>
  );
}
