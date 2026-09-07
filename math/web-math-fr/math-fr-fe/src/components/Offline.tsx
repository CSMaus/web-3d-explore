export function Offline({ what }: { what: string }) {
  return (
    <div className="rounded border border-warn/40 bg-warn/5 p-4">
      <p className="font-mono text-xs text-warn">the backend is not answering</p>
      <p className="mt-2 text-xs text-muted">{what}</p>
      <pre className="mt-3 overflow-x-auto rounded border border-edge bg-ground p-3 font-mono text-[11px] text-muted">
        {"cd math-fr-be\ndocker compose up -d --build"}
      </pre>
    </div>
  );
}
