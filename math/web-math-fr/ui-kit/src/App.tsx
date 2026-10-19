import { Gallery } from "./preview/Gallery";
import { Brand, Hero, Page, Panel, PanelHead, Plot, SearchButton, Tag, TopBar, TopBarDivider, TopBarLink } from "./components/pieces";
import { Button } from "./components/ui/button";

/**
 * the kit's own preview: the front page shape and every element, under the
 * current config. run the kit's dev server and edit the config with this open.
 * the site shows the same gallery under its real front page.
 */
export default function App() {
  return (
    <>
      <TopBar
        brand={<Brand href="#">M / Math</Brand>}
        actions={
          <>
            <SearchButton label="Search" shortcut="⌘K" />
            <Button variant="ghost">Log in</Button>
            <Button>Donate</Button>
          </>
        }
      >
        <TopBarLink href="#">Learn</TopBarLink>
        <TopBarLink href="#" active>Topics</TopBarLink>
        <TopBarLink href="#">Play</TopBarLink>
        <TopBarDivider />
        <TopBarLink href="#">About</TopBarLink>
        <TopBarLink href="#">Projects</TopBarLink>
        <TopBarLink href="#">Contact</TopBarLink>
      </TopBar>
      <Page className="pt-32">
        <Hero
          eyebrow="Mathematics, made visible"
          title={
            <>
              See the idea.
              <br />
              Then understand the math.
            </>
          }
          lede="Explore difficult, beautiful ideas through interactive experiments, visual stories, and notes that keep only what matters."
          actions={
            <>
              <Button>Start with fractals</Button>
              <Button variant="outline">Browse all topics</Button>
            </>
          }
          tags={
            <>
              <Tag>No prerequisites</Tag>
              <Tag colour="#9b8cf5">Learn at your pace</Tag>
              <Tag colour="#e5c76b">Free to explore</Tag>
            </>
          }
          picture={
            <Panel>
              <PanelHead meta="rotating">Mandelbulb</PanelHead>
              <Plot className="h-[480px]" />
            </Panel>
          }
        />
        <div className="mt-24">
          <Gallery />
        </div>
      </Page>
    </>
  );
}
