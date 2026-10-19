import { createFileRoute, notFound } from "@tanstack/react-router";
import { UsePage } from "@/components/UsePage";
import { pieceAt } from "@/content/uses";
import { COMPLEX } from "@/lib/complex";

export const Route = createFileRoute("/topics/complex/uses/$piece")({
  loader: ({ params }) => {
    const piece = pieceAt("complex", params.piece);
    if (!piece) throw notFound();
    return piece;
  },
  component: PiecePage,
});

function PiecePage() {
  const piece = Route.useLoaderData();
  return <UsePage topic={COMPLEX} piece={piece} />;
}
