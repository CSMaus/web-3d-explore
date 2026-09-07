import { Link, createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { PaletteBar } from "@/components/PaletteBar";

const Bulb = lazy(() => import("@/components/Bulb").then((m) => ({ default: m.Bulb })));

export const Route = createFileRoute("/")({
  component: Front,
});

const LINES = [
  "# this page is not finished yet...",
  "",
  'about = """',
  "    working...",
  '"""',
];

function Front() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <Suspense fallback={<div className="absolute inset-0 bg-ground" />}>
        <Bulb className="absolute inset-0 h-full w-full" />
      </Suspense>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ground/70 via-transparent to-ground/85" />
      <div className="relative z-10 flex h-full items-center px-6">
        <div className="mx-auto w-full max-w-6xl">
          <pre className="font-mono text-[13px] leading-relaxed text-muted sm:text-sm">
            {LINES.map((line, i) => (
              <div key={i}>
                {line.startsWith("#") ? <span className="text-leaf">{line}</span> : line}
                {line === "" ? "\u00a0" : null}
              </div>
            ))}
          </pre>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <PaletteBar />
          <Link
            to="/topics"
            className="rounded border border-leaf/60 px-3 py-1.5 font-mono text-[12px] text-leaf transition-colors hover:border-leaf"
          >
            the topics
          </Link>
        </div>
      </div>
    </main>
  );
}
