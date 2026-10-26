import { TabLink } from "@/components/TabLink";
import { usesOf, type PieceRoute, type UsesIndexRoute } from "@/lib/uses";
import { L } from "@/lib/lang";

/** the sub-tabs of a topic's applications: all, then one a built application. */
export function UsesTabs({ topic }: { topic: "fractals" | "chaos" | "complex" | "networks" | "tokens" }) {
  const index = `/topics/${topic}/uses` as UsesIndexRoute;
  const piece = `/topics/${topic}/uses/$piece` as PieceRoute;
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label={L("Applications")}>
      <TabLink to={index} activeOptions={{ exact: true }}>
        {L("All")}
      </TabLink>
      {usesOf(topic).map((u) =>
        u.to ? (
          <TabLink key={u.id} to={u.to}>
            {u.label}
          </TabLink>
        ) : u.piece ? (
          <TabLink key={u.id} to={piece} params={{ piece: u.piece }}>
            {u.label}
          </TabLink>
        ) : null,
      )}
    </nav>
  );
}
