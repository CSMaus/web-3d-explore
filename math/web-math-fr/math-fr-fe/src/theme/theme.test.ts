import { describe, expect, it } from "vitest";
import { applyTheme, clearTheme } from "@/theme/apply";
import { DEFAULT, parseTheme, shipInto, tokensCss, validName, variables } from "@/theme/theme";

describe("A theme", () => {
  it("round-trips through json unchanged", () => {
    expect(parseTheme(JSON.parse(JSON.stringify(DEFAULT)))).toEqual(DEFAULT);
  });

  it("is refused when a colour, a name, a number or a font is off", () => {
    const bad = (patch: Record<string, unknown>) => parseTheme({ ...JSON.parse(JSON.stringify(DEFAULT)), ...patch });
    expect(bad({ name: "../etc" })).toBeNull();
    expect(bad({ name: "Has Space" })).toBeNull();
    expect(bad({ colours: { ...DEFAULT.colours, ink: "red" } })).toBeNull();
    expect(bad({ scale: 9 })).toBeNull();
    expect(bad({ corner: -1 })).toBeNull();
    expect(bad({ fonts: { body: "x; } body { display: none", mono: "m" } })).toBeNull();
    expect(bad({ motion: "yes" })).toBeNull();
    expect(bad({ scheme: "blue" })).toBeNull();
    expect(parseTheme(null)).toBeNull();
  });

  it("keeps a saved name to letters, digits and hyphens", () => {
    expect(validName("warm-paper-2")).toBe(true);
    expect(validName("-leading")).toBe(false);
    expect(validName("a".repeat(41))).toBe(false);
    expect(validName("dots.json")).toBe(false);
    expect(validName(3)).toBe(false);
  });

  it("sets every token on a document and takes them off again", () => {
    const t = { ...DEFAULT, colours: { ...DEFAULT.colours, ink: "#123456" }, corner: 12, motion: false, scheme: "light" as const };
    applyTheme(document, t);
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--color-ink")).toBe("#123456");
    expect(root.style.getPropertyValue("--corner")).toBe("12px");
    expect(root.style.getPropertyValue("--spacing")).toBe("0.25rem");
    expect(root.classList.contains("still")).toBe(true);
    expect(root.style.colorScheme).toBe("light");
    clearTheme(document);
    expect(root.style.getPropertyValue("--color-ink")).toBe("");
    expect(root.classList.contains("still")).toBe(false);
    expect(Object.keys(variables(DEFAULT))).toContain("--font-body");
  });

  it("ships into the stylesheet by replacing only the two token blocks", () => {
    const css = [
      '@import "tailwindcss";',
      "",
      "@theme {",
      "  --color-ground: #000000;",
      "  --font-mono: monospace;",
      "}",
      "",
      ":root {",
      "  color-scheme: dark;",
      "}",
      "",
      "body { margin: 0; }",
      "",
    ].join("\n");
    const t = { ...DEFAULT, name: "paper", scheme: "light" as const, colours: { ...DEFAULT.colours, ground: "#fdf6e3" }, density: 1.2 };
    const out = shipInto(css, t);
    expect(out).toContain("--color-ground: #fdf6e3;");
    expect(out).toContain("--color-warn: #ff6b6b;");
    expect(out).toContain("color-scheme: light;");
    expect(out).toContain("--spacing: 0.3rem;");
    expect(out).toContain("body { margin: 0; }");
    expect(out).toContain('@import "tailwindcss";');
    expect(out).not.toContain("#000000");
    expect(shipInto(out, t)).toBe(out);
    const blocks = tokensCss(t);
    expect(out).toContain(blocks.theme);
    expect(out).toContain(blocks.root);
  });
});
