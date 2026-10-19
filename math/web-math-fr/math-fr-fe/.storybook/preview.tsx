import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import "../src/styles.css";
import { applyTheme } from "../src/theme/apply";
import { DEFAULT, parseTheme, type Theme } from "../src/theme/theme";

/**
 * every saved version in the themes folder is a choice in the toolbar, so a
 * component is judged under each of them. the site as designed is always
 * first.
 */
const files = import.meta.glob("../themes/*.json", { eager: true }) as Record<string, { default: unknown }>;
const THEMES: Theme[] = [DEFAULT, ...Object.values(files).map((m) => parseTheme(m.default)).filter((t): t is Theme => t !== null && t.name !== DEFAULT.name)];

function Themed({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(document, theme);
    window.dispatchEvent(new Event("retone"));
  }, [theme]);
  return <div className="min-h-screen bg-background p-8 text-foreground">{children}</div>;
}

const withTheme: Decorator = (Story, context) => {
  const name = context.globals.theme as string;
  const theme = THEMES.find((t) => t.name === name) ?? DEFAULT;
  return (
    <Themed theme={theme}>
      <Story />
    </Themed>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "A saved theme",
      toolbar: { title: "Theme", items: THEMES.map((t) => ({ value: t.name, title: t.name })), dynamicTitle: true },
    },
  },
  initialGlobals: { theme: DEFAULT.name },
  parameters: { layout: "fullscreen", backgrounds: { disable: true } },
};

export default preview;
