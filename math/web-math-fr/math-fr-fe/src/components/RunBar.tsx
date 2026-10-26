import { Button } from "@kit/index";
import { Slider } from "@/components/Slider";
import { L } from "@/lib/lang";

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
  what = L("steps"),
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
        <Button onClick={onToggle} variant={running ? "destructive" : "default"}>
          {running ? L("Pause") : done ? L("Run again") : L("Run")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onStep(1)} disabled={done}>
          {L("One step")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onStep(10)} disabled={done}>
          {L("Ten steps")}
        </Button>
        <Button variant="outline" size="sm" onClick={onReset}>
          {L("Reset")}
        </Button>
        <span data-text="caption" className="ml-auto">
          {fmt(count)} / {fmt(limit)} {what}
          {done ? <span className="text-selected"> {L("done")}</span> : null}
        </span>
      </div>
      <div className="mt-2 h-0.5 w-full overflow-hidden rounded bg-border">
        <div className="h-full bg-selected transition-[width]" style={{ width: `${fraction * 100}%` }} />
      </div>
      <div className="mt-3 space-y-2">
        {onLimit && limitRange ? (
          <Slider
            label={L("Stop after")}
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
            label={L("Speed")}
            min={0.02}
            max={4}
            step={0.02}
            value={perFrame}
            format={(v) => (v < 1 ? L("every {{n}} frames", { n: Math.round(1 / v) }) : `x${v.toFixed(0)}`)}
            onChange={onSpeed}
          />
        ) : (
          <Slider
            label={L("Speed")}
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
