type Props = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
};

export function Slider({ label, min, max, step, value, format, onChange }: Props) {
  return (
    <label className="grid grid-cols-[86px_1fr_60px] items-center gap-2">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-4 w-full accent-leaf"
      />
      <span className="text-right font-mono text-xs text-sky">
        {format ? format(value) : value.toFixed(3)}
      </span>
    </label>
  );
}
