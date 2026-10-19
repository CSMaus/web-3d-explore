import type { Meta, StoryObj } from "@storybook/react-vite";
import { EdgeFigure } from "../components/figures";
import { Brand, Counter, Display, Furniture, HeroPanel, IconCard, Lede, Screen, Screens, ScrollHint, Share, TopBar, TopBarDivider, TopBarLink } from "../components/pieces";
import { Button } from "../components/ui/button";

const meta: Meta = {
  title: "Pages/Screens",
  parameters: {
    docs: {
      description: {
        component:
          "A page as full-height screens that snap one at a time, from `config/<case>/motion.ts` (`screens`). `Screens` takes a scene that stays fixed behind every screen; the first screen's words sit in a `HeroPanel` that lifts away as the next screen arrives; `Furniture` holds the counter, the scroll hint and the share control at the foot. In the base case the same elements lay out as an ordinary page.",
      },
    },
  },
};
export default meta;

function Rings() {
  return (
    <div className="grid h-full place-items-center">
      <div className="relative h-[70vmin] w-[70vmin]">
        <div className="absolute inset-0 rounded-full border border-border opacity-60" />
        <div className="absolute inset-[12%] rounded-full border border-border opacity-40" />
        <div className="absolute inset-[24%]">
          <EdgeFigure kind="dragon" />
        </div>
      </div>
    </div>
  );
}

export const Stack: StoryObj = {
  name: "Three screens",
  parameters: { layout: "fullscreen", docs: { description: { story: "Scroll inside the canvas: the hero panel lifts off the scene, the second screen's words arrive, the third screen shows the cards." } } },
  render: () => (
    <div style={{ height: "100vh" }}>
      <>
        <TopBar
          brand={<Brand href="#">Optimind</Brand>}
          actions={
            <>
              <TopBarLink href="#">Team</TopBarLink>
              <TopBarLink href="#">Contact</TopBarLink>
            </>
          }
        >
          <TopBarLink href="#" active>Home</TopBarLink>
          <TopBarLink href="#">Services</TopBarLink>
          <TopBarLink href="#">Work</TopBarLink>
          <TopBarDivider />
          <TopBarLink href="#">Plans</TopBarLink>
        </TopBar>
        <Screens scene={<Rings />}>
          <Screen>
            <HeroPanel>
              <div className="mx-auto grid max-w-[var(--page-width)] gap-8 lg:grid-cols-2">
                <Display>
                  Growing
                  <br />
                  smarter with AI
                </Display>
                <div className="space-y-8">
                  <Lede>Workflow automation and personalised models for organisations that want to move.</Lede>
                  <div className="flex gap-3">
                    <Button>Get in touch</Button>
                    <Button variant="outline">Our services</Button>
                  </div>
                </div>
              </div>
            </HeroPanel>
            <Furniture>
              <Counter at={1} of={3} />
              <ScrollHint label="Scroll" />
              <Share label="Share" />
            </Furniture>
          </Screen>
          <Screen>
            <div className="mx-auto flex h-full min-h-screen max-w-[var(--page-width)] items-center px-[var(--page-gutter)]">
              <div className="max-w-xl space-y-6">
                <Display>
                  A full-service
                  <br />
                  AI agency.
                </Display>
                <Lede>Complete automation under one roof.</Lede>
              </div>
            </div>
            <Furniture>
              <Counter at={2} of={3} />
              <ScrollHint label="Scroll" />
              <Share label="Share" />
            </Furniture>
          </Screen>
          <Screen>
            <div className="mx-auto max-w-[var(--page-width)] px-[var(--page-gutter)] pt-32 pb-24">
              <div className="grid gap-8 lg:grid-cols-2">
                <Display>
                  Discover
                  <br />
                  our services
                </Display>
                <Lede>Complete automation under one roof.</Lede>
              </div>
              <div className="mt-12 grid gap-6 lg:grid-cols-3">
                <IconCard figure={<EdgeFigure kind="snowflake" />} title="Workflow optimisation">
                  Automate the work by connecting the applications already in use.
                </IconCard>
                <IconCard figure={<EdgeFigure kind="triangle" />} title="Business consulting">
                  A look at how an organisation works and where a model would change it.
                </IconCard>
                <IconCard figure={<EdgeFigure kind="squares" />} title="Chatbot development">
                  Assistants that hold a conversation and answer complicated questions.
                </IconCard>
              </div>
            </div>
            <Furniture>
              <Counter at={3} of={3} />
              <span />
              <Share label="Share" />
            </Furniture>
          </Screen>
        </Screens>
      </>
    </div>
  ),
};
