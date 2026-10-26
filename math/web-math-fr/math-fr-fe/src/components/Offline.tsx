import { Text } from "@kit/index";
import { L } from "@/lib/lang";

/** what a page says when content it needs is missing: the reason, and in development how to start the backend */
export function Offline({ what, title = L("The backend is not answering") }: { what: string; title?: string }) {
  return (
    <div className="rounded border border-destructive/40 bg-destructive/5 p-4">
      <Text kind="warning" as="p">{title}</Text>
      <Text kind="note" as="p" className="mt-2">{what}</Text>
      {import.meta.env.DEV ? (
        <pre data-text="caption" className="mt-3 overflow-x-auto rounded border border-border bg-background p-3">
          {"cd math-fr-be\ndocker compose up -d --build"}
        </pre>
      ) : null}
    </div>
  );
}
