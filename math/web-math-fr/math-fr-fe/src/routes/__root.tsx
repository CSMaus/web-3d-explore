import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Consent } from "@/components/Consent";
import { Menu } from "@/components/Menu";
import { Offline } from "@/components/Offline";

export const Route = createRootRoute({
  component: Shell,
  errorComponent: Broke,
});

function Broke({ error }: { error: unknown }) {
  return (
    <div className="min-h-full">
      <Menu />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
        <h1 className="font-mono text-sm tracking-wide text-warn">this page did not load</h1>
        <div className="mt-6">
          <Offline what={error instanceof Error ? error.message : "the reason was not reported"} />
        </div>
      </main>
    </div>
  );
}

function Shell() {
  return (
    <div className="min-h-full">
      <Menu />
      <Outlet />
      <Consent />
    </div>
  );
}
