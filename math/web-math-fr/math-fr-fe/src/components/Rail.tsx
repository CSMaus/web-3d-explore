import { cn } from "@/lib/cn";

export type RailItem = { id: string; label: string; accent?: string };

type Props = {
  items: RailItem[];
  here: string;
  onPick?: (id: string) => void;
  className?: string;
};

const MENU_HEIGHT = 96;

/**
 * the index that sits beside a long page. it lives in its own grid column
 * rather than at a fixed offset from the window edge, so it can never land on
 * top of the text however wide the window is.
 */
export function Rail({ items, here, onPick, className }: Props) {
  const jump = (id: string) => (event: React.MouseEvent) => {
    const node = document.getElementById(id);
    if (!node) return;
    event.preventDefault();
    onPick?.(id);
    // measured against the document rather than handed to the browser as a
    // fragment, so the landing place is the one computed at the moment of the
    // click and not one recomputed after the page has reflowed under it.
    const top = node.getBoundingClientRect().top + window.scrollY - MENU_HEIGHT;
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav className={cn("sticky top-24 self-start", className)} aria-label="on this page">
      <ol className="space-y-2.5">
        {items.map((item) => {
          const on = item.id === here;
          const tint = item.accent ?? "var(--color-leaf)";
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={jump(item.id)}
                className="flex items-start gap-2.5 py-0.5 no-underline"
                aria-current={on ? "true" : undefined}
              >
                <span
                  className="mt-2 block h-px shrink-0 transition-all duration-300"
                  style={{ width: on ? 26 : 12, background: on ? tint : "#3a4048" }}
                />
                <span
                  className="font-mono text-[13px] leading-snug transition-colors duration-300"
                  style={{ color: on ? tint : "#6d737d" }}
                >
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
