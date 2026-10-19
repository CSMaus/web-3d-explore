import { createFileRoute, notFound } from "@tanstack/react-router";
import { UsePage } from "@/components/UsePage";
import { pieceAt } from "@/content/uses";
import { TOKENS } from "@/lib/tokens";

export const Route = createFileRoute("/topics/tokens/uses/$piece")({
  loader: ({ params }) => {
    const piece = pieceAt("tokens", params.piece);
    if (!piece) throw notFound();
    return piece;
  },
  component: PiecePage,
});

function PiecePage() {
  const piece = Route.useLoaderData();
  return <UsePage topic={TOKENS} piece={piece} />;
}
