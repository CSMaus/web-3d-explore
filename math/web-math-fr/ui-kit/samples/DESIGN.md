# The sampled design

Five frames of a motion concept for an AI company's website (the author calls the company
Optimind). The frames are the source; this file says what is in them, how the page moves, and
how the same design becomes a case of the kit.

## The frames

- `IMG_1.jpg`: the first screen at rest. A light panel holds the headline, the lede and two
  buttons; the lower half of the screen is a dark wireframe object with lit particles.
- `IMG_2.jpg`: mid-scroll. The light panel has moved up behind the bar; the object has grown and
  risen into the gap.
- `IMG_3.jpg`: the second screen. The panel is gone, the object fills the middle, a new headline
  sits at the left over it.
- `IMG_2575.jpg` and `IMG_2576.jpg`: the services screen at two moments. Same layout, the three
  icons go from faint engraved outlines to bright lit relief.

## The overall look

- Light, not dark. The page is a warm grey (about `#c9c9c9` to `#d6d6d6`), with a soft top-to-
  bottom gradient and a faint vignette. Text is near-black on it; secondary text a mid grey.
- One accent: a warm gold light (about `#f0c070` to `#ffe0a0`) that is never a flat fill. It
  appears as glow: under the active link in the bar, under the primary button, inside the
  particles of the object, on the lit edges of the icons.
- The rounded edge around every frame is the device the concept is shown in, not the design;
  the page itself runs edge to edge.
- Glass. The top bar and the hero panel are frosted: slightly lighter than the page behind, a
  hairline under the bar, the object visible through the panel's lower edge as it slides.
- Type: an extended geometric grotesk in capitals for the headlines, tracked slightly wide
  (`GROWING SMARTER WITH AI`); a humanist sans for the lede and the card text; a small mono-like
  sans for the bar links, the counter and the share word. Headlines are two short lines, left
  aligned, large; the lede is set in a second column to the right of the headline, not under it.
- Buttons: pill. The primary is near-black with white text and a gold glow bleeding out from
  under its bottom edge. The secondary is an outline in the text colour on nothing.
- The bar: wordmark at the far left (`OPTIMIND`, tracked capitals), four links grouped left of
  centre, two links at the far right, a hairline under the whole bar. The active link has a
  short gold light under it on the hairline, a glow rather than a line.
- Small furniture: a page counter at the top left (`002 / 005`), a mouse icon at the bottom
  centre as the scroll hint, a share icon with the word at the bottom right.
- Cards: three equal columns, large rounded corners, a hairline edge, no fill difference from the
  page. The top two thirds hold one large icon; under it a title in sentence case and a short
  grey paragraph. A two-dot menu at the top right of the row.
- Icons: thick line shapes (a broken ring, a triangle, a nested square) drawn as relief. At rest
  they are engraved: the same grey as the card with a lighter top edge and a darker bottom edge.
  Lit, they are raised: bright faces, gold light on the upper edges, a soft drop shadow below.

## How it moves

Scroll (frames 1, 2, 3). The site is a stack of full-height screens, five of them by the counter,
and a scroll moves one screen at a time. The transition is layered, not a plain slide:

- The hero panel moves up and away, passing behind the bar, which stays fixed and transparent
  enough that the headline is seen through it for a moment.
- The object does not scroll with the panel. It sits on a fixed layer behind everything, and
  during the transition it grows and rises a little, so the panel seems to lift off it.
- The second screen's headline fades and rises into place at the left once the panel has gone.
- The counter ticks from `002 / 005` to `003 / 005` as the screen changes.
- The object turns slowly the whole time, independent of the scroll.

Time (frames 2575, 2576). On the services screen nothing moves in layout; the light moves. The
three icons breathe: the gold light on their edges and the brightness of their faces rise and
fall over a few seconds, each icon slightly out of phase with the others, and the page gradient
brightens with them. The same breathing is on the glow under the primary button and under the
active link.

## The object

A sphere of points joined into a wireframe, like a tangle of thread over a ball, with a cluster
of bright gold and orange particles inside and a dark smoky mass; two faint concentric rings
behind it on the page. In the source it is a rendered 3D scene. On the web it is a three.js
scene: a point cloud on a sphere with noise, lines between near neighbours, an inner cloud of
emissive points, fog, slow rotation, and the rings drawn as two circles on the page behind the
canvas. The kit gives it a place (a scene slot in the hero and a fixed layer behind the screens);
the object itself belongs to the site that uses it.

## As a case of the kit

Most of this is config. The case sets:

- `colours.ts`: scheme light; ground a warm grey; panel a lighter grey; ink near-black; muted a
  mid grey; edge a light hairline; accent the gold; accent2 a warm orange for the particles.
- `type.ts` and `text.ts`: a display style in capitals, tracked wide, two lines; a lede in the
  humanist sans; the nav, counter and share styles small and tracked; card title and card text
  styles.
- `page.ts`: gradient background, a wide reading width, large gutters.
- `topbar.ts`: hairline style, split alignment, the brand shown.
- `buttons.ts`: pill; primary rest with fill ink and ink ground; plain as an outline in ink.
- `panels.ts`: bordered with a large corner and a hairline, padding generous.
- `motion.ts`: transitions on, rise on.

What the kit does not have yet, to be added once so every case can use it:

- A `glow` on buttons and on the bar's marker: a colour and a blur, drawn under the element.
- A `glass` panel style: frosted, see-through, with a lighter inner edge.
- Elements: a page counter, a scroll hint, a share control, an icon card (icon above, title,
  text), and a relief icon with two states (engraved, lit) that the case colours.
- A screens layout: full-height sections with snap scrolling, a fixed layer behind them for a
  scene, and the panel-over-object transition as the default way one screen gives way to the next.
- A `breathe` motion: a slow rise and fall of glow strength with a period and a phase per element.

With those in the kit, this design is a folder under `config/`, chosen by one word in `case.ts`,
and the site that wants it supplies its object and its words.
