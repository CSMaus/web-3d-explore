import type { StorybookConfig } from "@storybook/react-vite";

/**
 * the component library, for development only. it borrows the site's own
 * vite config, so the stylesheet, the alias and the tokens are the real ones.
 */
const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.tsx"],
  core: { disableTelemetry: true },
};

export default config;
