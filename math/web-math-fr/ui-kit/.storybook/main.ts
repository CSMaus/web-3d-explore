import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "node:url";
import { kitThemePlugin } from "../build/dev.ts";

const kitDir = fileURLToPath(new URL("..", import.meta.url));

/** the kit's library: one story per element, every variant shown under the theme the config builds, with a docs page per element. */
const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  addons: ["@storybook/addon-docs"],
  stories: ["../src/**/*.stories.tsx"],
  core: { disableTelemetry: true },
  viteFinal: (cfg) => ({ ...cfg, plugins: [...(cfg.plugins ?? []), kitThemePlugin(kitDir)] }),
};

export default config;
