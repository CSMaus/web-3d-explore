import type { Meta, StoryObj } from "@storybook/react-vite";
import App from "../App";

const meta: Meta = {
  title: "Pages/The front page and every element",
  parameters: {
    docs: {
      description: {
        component:
          "The kit's own preview page: the top bar, the hero, and then every element the kit has in one column, the same page the site shows at `/kit`. Open it while editing the config to judge a change on everything at once.",
      },
    },
  },
};
export default meta;

export const Whole: StoryObj = {
  parameters: { docs: { description: { story: "The whole preview, scrolling." } } },
  render: () => <App />,
};
