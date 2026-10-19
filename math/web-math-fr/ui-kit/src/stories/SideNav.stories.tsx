import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label, SideNav, SideNavLink } from "../components/pieces";

const meta: Meta = {
  title: "Elements/Side navigation",
  parameters: {
    docs: {
      description: {
        component:
          "The rail beside a topic: the way back to the topics, the topic's name, its sections as a list, and under the open section its pages in their groups. One `nav` landmark named for the topic; the router marks the current link with `aria-current`, the open section with `data-open`. `side-nav.ts` has no script of its own: the colours come from `colours.ts` (`selected` for the current link, `border` for the rule), the text from `text.ts` (`crumb`, `topic`, `tab`, `label`).",
      },
    },
  },
};
export default meta;

function TopicRailSample() {
  return (
    <div className="w-[220px]">
      <SideNav label="Topic 1 - Fractals">
        <div>
          <a href="#topics" data-text="crumb">
            Topics
          </a>
        </div>
        <div data-slot="side-nav-title">
          <span data-text="topic">Topic 1 - Fractals</span>
        </div>
        <ul>
          <li>
            <SideNavLink href="#parts" level="section">
              Parts
            </SideNavLink>
          </li>
          <li>
            <SideNavLink href="#play" level="section" data-open="true">
              Play
            </SideNavLink>
            <ul data-slot="side-nav-pages">
              <li>
                <ul>
                  <li>
                    <SideNavLink href="#all">All</SideNavLink>
                  </li>
                </ul>
              </li>
              <li>
                <Label as="div">The calculus</Label>
                <ul>
                  <li>
                    <SideNavLink href="#rate" aria-current="page">
                      How fast
                    </SideNavLink>
                  </li>
                  <li>
                    <SideNavLink href="#rate2">Speeding up</SideNavLink>
                  </li>
                </ul>
              </li>
              <li>
                <Label as="div">One job</Label>
                <ul>
                  <li>
                    <SideNavLink href="#line">Draw the line</SideNavLink>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
          <li>
            <SideNavLink href="#theory" level="section">
              Mathematics
            </SideNavLink>
          </li>
          <li>
            <SideNavLink href="#uses" level="section">
              Applications
            </SideNavLink>
          </li>
        </ul>
      </SideNav>
    </div>
  );
}

export const Rail: StoryObj = {
  parameters: { docs: { description: { story: "The play section open, with its groups, and one page current." } } },
  render: () => <TopicRailSample />,
};
