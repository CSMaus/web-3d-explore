import { createFileRoute, redirect } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { Suspense, lazy } from "react";
import { FrontHero } from "@/components/FrontHero";

// the kit preview exists only in development: the real front page, then every
// element the kit has, under the config as it stands. in a build the address
// sends the reader home.
const Gallery = import.meta.env.DEV ? lazy(() => import("@kit/preview/Gallery").then((m) => ({ default: m.Gallery }))) : () => null;

export const Route = createFileRoute("/kit")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw redirect({ to: "/" });
  },
  component: KitPreview,
});

function KitPreview() {
  return (
    <main data-slot="page" className="pt-32 pb-24">
      <FrontHero />
      <div className="mt-24 border-t border-border pt-12">
        <Text kind="caption" as="p" className="mb-8">Every element the kit has, under the config as it stands. Save a script under ui-kit/config and this page follows.</Text>
        <Suspense fallback={null}>
          <Gallery />
        </Suspense>
      </div>
    </main>
  );
}
