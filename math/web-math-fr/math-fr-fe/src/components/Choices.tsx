type Props<T extends string> = {
  options: { id: T; label: string }[];
  value: T;
  onPick: (id: T) => void;
};

/** a row of named choices, one of which is picked. the same on every page. */
export function Choices<T extends string>({ options, value, onPick }: Props<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onPick(o.id)}
          aria-pressed={value === o.id}
          className={
            value === o.id
              ? "rounded border border-leaf px-2.5 py-1 font-mono text-[11px] text-leaf"
              : "rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-muted"
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
