import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { to: "/", label: "home" },
  { to: "/topics", label: "topics" },
  { to: "/account", label: "account" },
] as const;

export function Menu() {
  const [past, setPast] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        past ? "border-b border-edge bg-ground/70 backdrop-blur-md" : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-3 font-mono text-[13px]">
        <span className="mr-auto text-muted">maths</span>
        {ITEMS.map((item) => {
          const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded px-3 py-1 transition-colors",
                active ? "text-leaf" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
