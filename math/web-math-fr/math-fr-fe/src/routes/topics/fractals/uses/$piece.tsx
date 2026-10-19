import { createFileRoute, notFound } from "@tanstack/react-router";
import { RuinFigure } from "@/components/RuinFigure";
import { UsePage } from "@/components/UsePage";
import { pieceAt } from "@/content/uses";
import { FRACTALS } from "@/lib/topic";

export const Route = createFileRoute("/topics/fractals/uses/$piece")({
  loader: ({ params }) => {
    const piece = pieceAt("fractals", params.piece);
    if (!piece) throw notFound();
    return piece;
  },
  component: PiecePage,
});

function PiecePage() {
  const piece = Route.useLoaderData();
  return <UsePage topic={FRACTALS} piece={piece} figures={{ ruin: <RuinFigure /> }} />;
}
