import { createFileRoute, notFound } from "@tanstack/react-router";
import { UsePage } from "@/components/UsePage";
import { pieceAt } from "@/content/uses";
import { CHAOS } from "@/lib/chaos";

export const Route = createFileRoute("/topics/chaos/uses/$piece")({
  loader: ({ params }) => {
    const piece = pieceAt("chaos", params.piece);
    if (!piece) throw notFound();
    return piece;
  },
  component: PiecePage,
});

function PiecePage() {
  const piece = Route.useLoaderData();
  return <UsePage topic={CHAOS} piece={piece} />;
}
