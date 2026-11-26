import { createFileRoute, notFound } from "@tanstack/react-router";
import { UsePage } from "@/components/UsePage";
import { pieceAt } from "@/content/uses";
import { PROBABILITY } from "@/lib/probability";

export const Route = createFileRoute("/topics/probability/uses/$piece")({
  loader: ({ params }) => {
    const piece = pieceAt("probability", params.piece);
    if (!piece) throw notFound();
    return piece;
  },
  component: PiecePage,
});

function PiecePage() {
  const piece = Route.useLoaderData();
  return <UsePage topic={PROBABILITY} piece={piece} />;
}
