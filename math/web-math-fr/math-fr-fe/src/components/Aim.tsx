import { Slider } from "@/components/Slider";
import { Label, Button, Text } from "@kit/index";
import { L } from "@/lib/lang";

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
    <section data-slot="panel">
      <Label>{L("ROTATION MODE")}</Label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[true, false].map((on) => (
          <Button variant="outline" size="sm"
            key={String(on)}
            type="button"
            onClick={() => onTurning(on)}
            aria-pressed={turning === on}
          >
            {on ? L("Auto") : L("Manual")}
          </Button>
        ))}
        <Button variant="outline" size="sm"
          type="button"
          onClick={onReset}
        >
          {L("Reset view")}
        </Button>
      </div>
      {turning ? (
        <div className="mt-3">
          <Slider label={L("Loop time")} min={12} max={120} step={1} value={period} format={(v) => `${Math.round(v)} s`} onChange={(v) => onPeriod(Math.round(v))} />
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Slider label={L("Azimuth")} min={-Math.PI} max={Math.PI} step={0.005} value={azimuth} format={(v) => L("{{v}} deg", { v: ((v * 180) / Math.PI).toFixed(0) })} onChange={(v) => onAim(v, elevation)} />
          <Slider label={L("Elevation")} min={-Math.PI / 2} max={Math.PI / 2} step={Math.PI / 360} value={elevation} format={(v) => L("{{v}} deg", { v: ((v * 180) / Math.PI).toFixed(0) })} onChange={(v) => onAim(azimuth, v)} />
        </div>
      )}
      <Text kind="note" as="p" className="mt-3">
        {L("Drag the picture to turn it, in either mode; the wheel brings it closer. Dragging switches to manual.")}
      </Text>
    </section>
  );
}
