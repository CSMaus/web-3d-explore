# UI kit

The component library the site is built on, and the one place its look is set.

## What it is

A shadcn project on Radix primitives, with Tailwind for every style. The look is not in the
components: it is in the scripts under `config/`, one per concern (colours, type, text, page, top
bar, buttons, tabs, sliders, inputs, panels, plots, motion). Every structural choice in them is
a word from a typed union, so an editor completes the allowed words and a wrong one fails to
compile, and every field carries a comment saying what it changes. `build/theme.ts` renders those
scripts into `src/theme.css`, and that generated sheet is what a project ships. The components
carry no structural choice of their own, so a config change is the whole change.

Two scripts carry most of the look. `config/text.ts` names every kind of text in the app, from
the display line to the keyboard key, each with its font, size, weight, leading, tracking, case,
colour and an optional background, and a line saying where it is used; a new entry is a new style,
reached with the `Text` element. `config/buttons.ts` writes out each state of a button, at rest,
under the pointer and pressed, as a border width, a border colour, a fill and a text colour, for
the plain button and the primary one.

## Layout

- `config/` - The scripts to edit, one folder per design (a case: `base`, `edge_light`); `case.ts`
  names the case in use, `cases.ts` lists them, `kinds.ts` holds the types. Every case has a light
  and a dark palette.
- `build/theme.ts` - Renders the config into `src/theme.css`.
- `build/dev.ts` - The dev-server plugins: the sheet regenerated on save, and the endpoint the
  case switch writes through.
- `src/components/ui/` - Files from the shadcn registry, with relative imports so they work from
  a consuming project.
- `src/components/pieces.tsx` and `controls.tsx` - The kit's own elements: page, top bar,
  heading, text, label, panel, figure, plot frame, caption, verdict, readout, banner, choices,
  chips, field, frame, screens, counter, scroll hint, share, icon card, the mode and case switches.
- `src/components/figures.tsx` and `src/lib/figures.ts` - Fractal line figures (Koch snowflake,
  Sierpinski triangle, Vicsek squares, dragon curve) with a light travelling along their edges.
- `src/preview/Gallery.tsx` - Every element under the current config, with the text styles read
  from the config itself; the site shows it at `/kit` in development.
- `src/index.ts` - Everything a project imports.
- `src/index.css` - Tailwind, the registry's base styles and the generated theme, in that order.
- `src/stories/` - Storybook: a group per element with a docs page saying what it is, where the
  site uses it and which config script sets it, and a story per variant; the palette and the text
  styles are read from the config itself. Foundations, then elements, then two whole pages.

## Using it from a project

Three things: a path alias to `ui-kit/src`, one `@source` line pointing Tailwind at that folder,
and the kit's runtime packages installed in the project. The project imports `src/index.css` once
and brings its own `config/` folder. The commands for building the theme, running Storybook and
adding registry components are in the services' `docs/commands.md`.
