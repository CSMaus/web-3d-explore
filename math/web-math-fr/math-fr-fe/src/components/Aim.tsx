import { Slider } from "@/components/Slider";

type Props = {
  turning: boolean;
  onTurning: (on: boolean) => void;
  azimuth: number;
  elevation: number;
  onAim: (azimuth: number, elevation: number) => void;
  period: number;
  onPeriod: (s: number) => void;
  onReset: () => void;
};

/**
 * how a three-dimensional picture is aimed: turning on its own, or by hand.
 * dragging the picture always works and switches to by hand; this panel is
 * the same choice made with buttons, and the numbers behind it.
 */
export function Aim({ turning, onTurning, azimuth, elevation, onAim, period, onPeriod, onReset }: Props) {
  return (
    <section className="rounded border border-edge p-4">
      <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">ROTATION MODE</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[true, false].map((on) => (
          <button
            key={String(on)}
            type="button"
            onClick={() => onTurning(on)}
            aria-pressed={turning === on}
            className={
              turning === on
                ? "rounded border border-leaf px-2.5 py-1 font-mono text-[11px] text-leaf"
                : "rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-muted"
            }
          >
            {on ? "Auto" : "Manual"}
          </button>
        ))}
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-leaf"
        >
          Reset view
        </button>
      </div>
      {turning ? (
        <div className="mt-3">
          <Slider label="Loop time" min={12} max={120} step={1} value={period} format={(v) => `${Math.round(v)} s`} onChange={(v) => onPeriod(Math.round(v))} />
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Slider label="Azimuth" min={-Math.PI} max={Math.PI} step={0.005} value={azimuth} format={(v) => `${((v * 180) / Math.PI).toFixed(0)} deg`} onChange={(v) => onAim(v, elevation)} />
          <Slider label="Elevation" min={-Math.PI / 2} max={Math.PI / 2} step={Math.PI / 360} value={elevation} format={(v) => `${((v * 180) / Math.PI).toFixed(0)} deg`} onChange={(v) => onAim(azimuth, v)} />
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted">
        Drag the picture to turn it, in either mode; the wheel brings it closer. Dragging switches
        to manual.
      </p>
    </section>
  );
}
