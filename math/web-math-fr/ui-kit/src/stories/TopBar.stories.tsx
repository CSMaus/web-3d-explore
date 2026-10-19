import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Brand, LanguageSwitch, SearchButton, TopBar, TopBarDivider, TopBarLink } from "../components/pieces";
import { Button } from "../components/ui/button";

const meta: Meta = {
  title: "Elements/Top bar",
  parameters: {
    docs: {
      description: {
        component:
          "The bar across the top of every page, from `config/topbar.ts`: style (hairline, solid, floating, none), alignment, height, whether the wordmark shows, and how the current page's link is marked. Inside it: `Brand` (the mark and the wordmark, `brand` style), `TopBarLink`s with a divider (`nav` style), and the actions at the right: `SearchButton` with its key, `LanguageSwitch`, Log in and Donate. Held in place here; on the site it is fixed.",
      },
    },
  },
};
export default meta;

function LanguageDemo() {
  const [lang, setLang] = useState("en");
  return <LanguageSwitch value={lang} onChange={setLang} label="Language" options={[{ code: "en", label: "EN", name: "English" }, { code: "xx", label: "XX", name: "Another" }]} />;
}

export const Full: StoryObj = {
  parameters: { docs: { description: { story: "The bar as the site shows it: brand, the two groups of links, search, language, log in and donate." } } },
  render: () => (
    <div className="relative h-24">
      <TopBar
        className="!absolute"
        brand={<Brand href="#">M / Math</Brand>}
        actions={
          <>
            <SearchButton label="Search" shortcut="⌘K" />
            <LanguageDemo />
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
    </div>
  ),
};

export const Parts: StoryObj = {
  parameters: { docs: { description: { story: "The pieces of the bar on their own: the brand, a link at rest and the active one, the search button, the language switch." } } },
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <Brand href="#">M / Math</Brand>
      <span className="flex items-center">
        <TopBarLink href="#">Learn</TopBarLink>
        <TopBarLink href="#" active>Topics</TopBarLink>
      </span>
      <SearchButton label="Search" shortcut="⌘K" />
      <LanguageDemo />
    </div>
  ),
};
