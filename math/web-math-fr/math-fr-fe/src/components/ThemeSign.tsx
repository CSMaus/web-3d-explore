/**
 * the small sign beside a theme's name in the bar: a sun for the warm theme, a prompt for the
 * green one, a snowflake for the cool one, a cat's head for the pixel one. drawn in the line of the bar, in the theme's own light.
 */
export function ThemeSign({ kind }: { kind: "sun" | "prompt" | "flake" | "cat" }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {kind === "sun" ? (
        <>
          <circle cx={8} cy={8} r={3} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={8 + 5 * Math.cos(a)} y1={8 + 5 * Math.sin(a)} x2={8 + 6.8 * Math.cos(a)} y2={8 + 6.8 * Math.sin(a)} />;
          })}
        </>
      ) : kind === "cat" ? (
        <>
          <path d="M3 13 V5 L5.5 7.5 H10.5 L13 5 V13 Z" />
          <circle cx={6.3} cy={10} r={0.7} fill="currentColor" stroke="none" />
          <circle cx={9.7} cy={10} r={0.7} fill="currentColor" stroke="none" />
        </>
      ) : kind === "prompt" ? (
        <>
          <path d="M3 4 L7 8 L3 12" />
          <path d="M9 12 H13" />
        </>
      ) : (
        <>
          {[0, 60, 120].map((d) => {
            const a = (d * Math.PI) / 180;
            return <line key={d} x1={8 - 6.5 * Math.cos(a)} y1={8 - 6.5 * Math.sin(a)} x2={8 + 6.5 * Math.cos(a)} y2={8 + 6.5 * Math.sin(a)} />;
          })}
          <circle cx={8} cy={8} r={1.2} fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}
