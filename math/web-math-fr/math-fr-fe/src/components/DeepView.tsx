import type { Stage, Tile } from "@/lib/deep";

type Props = { tile: Tile | null; stage: Stage; className?: string };

const WORD: Record<Stage["kind"], string> = {
  idle: "not started",
  opening: "opening the connection",
  working: "rendering",
  done: "finished",
  refused: "refused",
  busy: "the server is busy",
  lost: "the connection was lost",
};

/**
 * the picture the server sent. it is an image rather than a canvas, so the
 * browser scales it and a coarse level stays visible while a finer one is
 * still being computed.
 */
export function DeepView({ tile, stage, className }: Props) {
  const note =
    stage.kind === "working"
      ? `${WORD.working}, pass ${stage.done} of 4`
      : stage.kind === "refused" || stage.kind === "busy" || stage.kind === "lost"
        ? `${WORD[stage.kind]}: ${stage.reason}`
        : WORD[stage.kind];

  return (
    <div className={className}>
      {tile ? (
        <img
          src={`data:image/png;base64,${tile.png}`}
          alt="the set rendered on the server"
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <span className="font-mono text-[11px] text-muted">{note}</span>
        </div>
      )}
      {tile ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-baseline justify-between bg-ground/70 px-2 py-1 font-mono text-[10px] text-muted">
          <span>{note}</span>
          <span>
            {tile.width} by {tile.height}
          </span>
        </div>
      ) : null}
    </div>
  );
}
