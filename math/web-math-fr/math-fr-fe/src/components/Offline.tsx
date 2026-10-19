import { Text } from "@kit/index";

export function Offline({ what }: { what: string }) {
  return (
    <div className="rounded border border-destructive/40 bg-destructive/5 p-4">
      <Text kind="warning" as="p">The backend is not answering</Text>
      <Text kind="note" as="p" className="mt-2">{what}</Text>
      <pre data-text="caption" className="mt-3 overflow-x-auto rounded border border-border bg-background p-3">
        {"cd math-fr-be\ndocker compose up -d --build"}
      </pre>
    </div>
  );
}
