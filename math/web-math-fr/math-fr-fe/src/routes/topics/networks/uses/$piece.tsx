import { createFileRoute, notFound } from "@tanstack/react-router";
import { UsePage } from "@/components/UsePage";
import { pieceAt } from "@/content/uses";
import { NETWORKS } from "@/lib/networks";

export const Route = createFileRoute("/topics/networks/uses/$piece")({
  loader: ({ params }) => {
    const piece = pieceAt("networks", params.piece);
    if (!piece) throw notFound();
    return piece;
  },
  component: PiecePage,
});

function PiecePage() {
  const piece = Route.useLoaderData();
  return <UsePage topic={NETWORKS} piece={piece} />;
}
