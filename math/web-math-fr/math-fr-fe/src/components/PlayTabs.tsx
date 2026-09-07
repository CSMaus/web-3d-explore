import { Link } from "@tanstack/react-router";
import { SYSTEMS } from "@/lib/systems";

export function PlayTabs() {
  return (
    <nav className="flex flex-wrap gap-1.5">
      <Link
        to="/topics/fractals/play"
        activeOptions={{ exact: true }}
        className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-muted"
        activeProps={{ className: "border-leaf text-leaf" }}
      >
        all
      </Link>
      {SYSTEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-muted"
          activeProps={{ className: "border-leaf text-leaf" }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
