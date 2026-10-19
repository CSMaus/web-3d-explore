# pixel_art_cute: research, assets and examples

The case folder `ui-kit/config/pixel_art_cute/` exists and compiles; every script starts from
`edge_light` except `colours.ts`, which carries the green peach palette (`T_GP`). The shape is
decided here first; the colours change later.

## What is in this folder

```
assets/
  oneko/              the walking, sleeping cat as it lives on web pages since 1989
    oneko.gif         the sprite sheet: 32 by 32 frames, idle, walk in eight directions,
                      sleep (with the z), scratch, alert, yawn
    oneko.js          the script that moves it after the pointer and puts it to sleep
    LICENSE.txt       MIT, adryd 2022 (the script); the sprites are the classic neko set
  opengameart-cat/    a second cat, CC0 (Shepardskin, opengameart.org/content/cat-sprites)
    cat-preview.gif   what it looks like
    cat-sprite.zip    the sheets; unpacked/ holds them as PNG
  CatUI/              the pack the owner downloaded: a cat with rooms, beds, toys and a pixel
                      interface (buttons, icons, a health bar). the cat animations are sprite
                      sheets, not GIFs: one PNG holds every frame side by side, and a page plays
                      them by stepping across the sheet (css steps() or a canvas). the GIFs on
                      the shop page are previews rendered from these sheets.
    CatPackFree/Idle.png         10 frames of 32 by 32 in a row
    CatRoomPaid/CatSleeping.png  6 frames of 48 by 48 in a row
    CatPackPaid/CatPackDifferentSkins/*.png  the whole cat, three coats: a 512 by 640 grid of
                                 32 by 32 frames, one animation a row (idle, walk, sit, sleep,
                                 stretch, in the box, at the bowl, and more)
    CatPackPaid/Sprites/*.png    later additions, same grid
    CatPackPaid/CatItems/CatToys/*.gif  the only GIFs in the pack, the toys
    previews/                    GIFs rendered here from the sheets, four times their size, so
                                 the animations can be watched: idle, sleeping, drculacat, mouse
examples/
  adryd-com-oneko-demo.png     the cat on a real page (small, beside the heading)
  stardewvalley-net.png        a whole site in pixel art: sky, hills, trees, a logo in pixel wood
  onepagelove-pixel-gallery.png  a gallery of thirty-eight one-page sites in the style
  sasha-works.png              pixels as accents only, in hover states and a footer
  nes-css-site.png             the eight-bit panel and button shapes drawn in CSS
```

## The shape, before any colour

What the examples agree on, and what the case would take:

- **Edges are steps.** Every corner is square or stepped; the pill and the hairline are gone.
  Panels and buttons get a two-pixel border drawn with stepped shadows, the way NES.css does
  it (see `examples/nes-css-site.png`), and a one-pixel offset shadow instead of a glow.
- **Type is pixel type.** Pixelify Sans for running text (readable, variable weight), Silkscreen
  for labels, Press Start 2P only for the display line. All on Google Fonts, Open Font License.
- **Everything snaps to the grid.** Positions and sizes in whole pixels, `image-rendering:
  pixelated` on every sprite, no easing: motion in steps, like the cat's walk.
- **The cat.** `oneko.gif` is the reference: it walks after the pointer, sits, yawns, falls
  asleep with a z, wakes when the pointer moves. On this site it would walk along the foot of
  the screen instead of chasing the pointer, and sleep on the Mandelbulb's shadow. The sheet is
  32 by 32; drawn at three times its size it stays crisp.
- **The figures.** The fractal figures keep their shapes but the light along the edge becomes a
  two-pixel bright square that hops from step to step.
- **The Mandelbulb.** Either as it is, or quantised to the palette in the shader so it reads as
  pixel art too (a posterise step and a lower render scale); both are a few lines.

## Choices open

1. The cat: oneko as it is (recoloured to the palette), the CC0 OpenGameArt cat, or one drawn for the site.
2. How far the pixel goes: the whole page (panels, buttons, bar) or only the mascot and the figures.
3. Whether the Mandelbulb is quantised.

## Sources

- [oneko.js](https://github.com/adryd325/oneko.js) and its [demo](https://adryd.com)
- [Cat sprites, CC0](https://opengameart.org/content/cat-sprites)
- [Free Pixel Animation - Cat, CC0, walk and sleep](https://zeenaz.itch.io/free-pixel-animation-cat-6-loops) (not downloaded: itch.io downloads go through its page)
- [Catset](https://seethingswarm.itch.io/catset), [Cat 2D Pixel Art](https://xzany.itch.io/cat-2d-pixel-art), [Cat Sleeping Animation](https://toffeecraft.itch.io/cat-sleeping-animation-free) (custom licences, read on the page)
- [NES.css](https://nostalgic-css.github.io/NES.css/), [SNES.css](https://snes-css.sadlative.com/)
- [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans), [Silkscreen](https://fonts.google.com/specimen/Silkscreen), [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)
- [One Page Love, pixel art gallery](https://onepagelove.com/style/pixel-art), [Sage Agency on pixel sites](https://sage.agency/blog/websites-that-use-cool-pixel-art-design/), [an Awwwards one-bit pixel portfolio](https://www.awwwards.com/sites/1-bit-pixel-art-dev-portfolio)
