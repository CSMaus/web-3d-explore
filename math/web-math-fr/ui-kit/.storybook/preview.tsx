import type { Preview } from "@storybook/react-vite";
import { themes } from "storybook/theming";
import { theme } from "../config/index.ts";
import "../src/index.css";

// the docs pages take the palette of the mode the case starts in
const palette = theme.colours[theme.colours.default];

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { disable: true },
    docs: {
      theme: {
        ...(palette === theme.colours.dark ? themes.dark : themes.light),
        appBg: palette.background,
        appContentBg: palette.background,
        appPreviewBg: palette.background,
        textColor: palette.foreground,
        textMutedColor: palette["muted-foreground"],
        barBg: palette.card,
        inputBg: palette.card,
        appBorderColor: palette.border,
        colorPrimary: palette.primary,
        colorSecondary: palette.secondary,
      },
    },
    options: {
      storySort: {
        order: [
          "Foundations",
          ["Colours", "Text", "Page"],
          "Elements",
          ["Buttons", "Choices and chips", "Tabs", "Sliders", "Inputs", "Badges", "Panels", "Plots and captions", "Verdicts and readouts", "Display, lede, tags and labels", "Links, strip and skip link", "Banner", "Tooltip", "Top bar", "Hero"],
          "Pages",
          ["A play page", "The front page and every element"],
        ],
      },
    },
  },
  decorators: [
    (Story, context) =>
      context.viewMode === "docs" ? (
        <div className="rounded-xl bg-background p-6 text-foreground">
          <Story />
        </div>
      ) : (
        <div className="min-h-screen bg-background p-8 text-foreground">
          <Story />
        </div>
      ),
  ],
};

export default preview;
