import { createFileRoute, notFound } from "@tanstack/react-router";
import { CalculatorFigure } from "@/components/CalculatorFigure";
import { UsePage } from "@/components/UsePage";
import { pieceAt } from "@/content/uses";
import { SERIES } from "@/lib/series";

export const Route = createFileRoute("/topics/series/uses/$piece")({
  loader: ({ params }) => {
    const piece = pieceAt("series", params.piece);
    if (!piece) throw notFound();
    return piece;
  },
  component: PiecePage,
});

function PiecePage() {
  const piece = Route.useLoaderData();
  return <UsePage topic={SERIES} piece={piece} figures={{ calculator: <CalculatorFigure /> }} />;
}
