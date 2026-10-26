import type { Stage, Tile } from "@/lib/deep";
import { L } from "@/lib/lang";

type Props = { tile: Tile | null; stage: Stage; className?: string };

const WORD: Record<Stage["kind"], string> = {
  idle: L("Not started"),
  opening: L("Opening the connection"),
  working: L("rendering"),
  done: L("finished"),
  refused: L("refused"),
  busy: L("The server is busy"),
  lost: L("The connection was lost"),
};

/**
 * the picture the server sent. it is an image rather than a canvas, so the
 * browser scales it and a coarse level stays visible while a finer one is
 * still being computed.
 */
export function DeepView({ tile, stage, className }: Props) {
  const note =
    stage.kind === "working"
      ? L("rendering, pass {{done}} of 4", { done: stage.done })
      : stage.kind === "refused" || stage.kind === "busy" || stage.kind === "lost"
        ? `${WORD[stage.kind]}: ${stage.reason}`
        : WORD[stage.kind];

  return (
    <div className={className}>
      {tile ? (
        <img
          src={`data:image/png;base64,${tile.png}`}
          alt={L("The set rendered on the server")}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <span data-text="caption">{note}</span>
        </div>
      )}
      {tile ? (
        <div data-text="caption" className="pointer-events-none absolute inset-x-0 bottom-0 flex items-baseline justify-between bg-background/70 px-2 py-1">
          <span>{note}</span>
          <span>
            {L("{{w}} by {{h}}", { w: tile.width, h: tile.height })}
          </span>
        </div>
      ) : null}
    </div>
  );
}
