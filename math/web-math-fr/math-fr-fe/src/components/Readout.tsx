export function Readout({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="col-span-2 grid grid-cols-subgrid">
          <dt className="text-muted">{k}</dt>
          <dd className="text-leaf">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
