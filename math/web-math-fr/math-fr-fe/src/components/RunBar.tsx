import { Slider } from "@/components/Slider";

type Props = {
  running: boolean;
  count: number;
  /** where the run stops on its own, in the same unit as count. no run is open-ended */
  limit: number;
  onToggle: () => void;
  onStep: (many: number) => void;
  onReset: () => void;
  perFrame: number;
  onSpeed: (v: number) => void;
  what?: string;
  /** slow: from one step every few seconds up to a few a frame. fast: one to two hundred a frame */
  pace?: "slow" | "fast";
  /** when the page lets the reader move the stop point */
  onLimit?: (v: number) => void;
  limitRange?: { min: number; max: number; step: number };
  limitFormat?: (v: number) => string;
};

/**
 * play, one step, reset and a speed, in one place with one set of names. every
 * page that shows something happening gets the same bar so the controls are
 * learned once. every run has a stop point, shown beside the count, and the
 * bar fills towards it.
 */
export function RunBar({
  running,
  count,
  limit,
  onToggle,
  onStep,
  onReset,
  perFrame,
  onSpeed,
  what = "steps",
  pace = "fast",
  onLimit,
  limitRange,
  limitFormat,
}: Props) {
  const done = limit > 0 && count >= limit;
  const fraction = limit > 0 ? Math.max(0, Math.min(1, count / limit)) : 0;
  const fmt = (v: number) => (limitFormat ? limitFormat(v) : Number.isInteger(v) ? v.toLocaleString("en") : v.toFixed(1));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className={
            running
              ? "rounded border border-warn px-3 py-1.5 font-mono text-[11px] text-warn"
              : "rounded border border-leaf px-3 py-1.5 font-mono text-[11px] text-leaf"
          }
        >
          {running ? "Pause" : done ? "Run again" : "Run"}
        </button>
        <button
          type="button"
          onClick={() => onStep(1)}
          disabled={done}
          className="rounded border border-edge px-3 py-1.5 font-mono text-[11px] text-muted hover:border-leaf disabled:opacity-40"
        >
          One step
        </button>
        <button
          type="button"
          onClick={() => onStep(10)}
          disabled={done}
          className="rounded border border-edge px-3 py-1.5 font-mono text-[11px] text-muted hover:border-leaf disabled:opacity-40"
        >
          Ten steps
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-edge px-3 py-1.5 font-mono text-[11px] text-muted hover:border-leaf"
        >
          Reset
        </button>
        <span className="ml-auto font-mono text-[11px] text-muted">
          {fmt(count)} / {fmt(limit)} {what}
          {done ? <span className="text-leaf"> done</span> : null}
        </span>
      </div>
      <div className="mt-2 h-0.5 w-full overflow-hidden rounded bg-edge">
        <div className="h-full bg-leaf transition-[width]" style={{ width: `${fraction * 100}%` }} />
      </div>
      <div className="mt-3 space-y-2">
        {onLimit && limitRange ? (
          <Slider
            label="Stop after"
            min={limitRange.min}
            max={limitRange.max}
            step={limitRange.step}
            value={limit}
            format={(v) => `${fmt(v)} ${what}`}
            onChange={onLimit}
          />
        ) : null}
        {pace === "slow" ? (
          <Slider
            label="Speed"
            min={0.02}
            max={4}
            step={0.02}
            value={perFrame}
            format={(v) => (v < 1 ? `every ${Math.round(1 / v)} frames` : `x${v.toFixed(0)}`)}
            onChange={onSpeed}
          />
        ) : (
          <Slider
            label="Speed"
            min={1}
            max={200}
            step={1}
            value={perFrame}
            format={(v) => `x${Math.round(v)}`}
            onChange={(v) => onSpeed(Math.round(v))}
          />
        )}
      </div>
    </div>
  );
}
