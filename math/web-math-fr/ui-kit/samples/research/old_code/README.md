# old_code: research and examples

The case folder `ui-kit/config/old_code/` exists and compiles; every script starts from
`edge_light` except `colours.ts`, which carries three phosphor palettes (`T_GN` green, `T_AM`
amber, `T_WH` white), dark by default with paper as the light mode. The shape is decided here
first; the colours are a select away.

## What is in this folder

```
examples/
  retro-web-terminal.png       the strongest reference: an amber screen inside a cream bezel,
                               with a phosphor switch (amber, green, colour) and an effects toggle
  hackertyper-dev.png          the plain green screen, type filling the page
  codefronts-crt-tabs.png      a CRT tab bar, MIT, as a small element done in the style
  coolretroterminal-com.png    a 2026 page in the look, for how the style reads today
  cool-retro-term-1.gif        three GIFs and three stills of the desktop terminal that defined
  cool-retro-term-2.gif        the look: amber and green, scanlines, glow, curvature, flicker
  cool-retro-term-3.gif
  cool-retro-term-4.png
  cool-retro-term-5.png
  cool-retro-term-6.jpg
  imetomi-terminal.png         a React gallery in the cassette-futurism style: amber phosphor,
  imetomi-lcd-device.png       curved glass, vignette, and an LCD device for contrast
  imetomi-moodboard.png        its moodboard
```

## The shape, before any colour

- **The screen is the page.** One dark surface with scanlines at low contrast and a soft
  vignette at the corners; the glow is on the type, drawn with layered text shadows, not on
  boxes. `examples/retro-web-terminal.png` shows the bezel; the case would keep the screen and
  drop the bezel, which is a frame.
- **Type is monospaced, in capitals for headings, with a block cursor** after the display line
  and the active link. A real monospaced face with italics and a readable x-height, not a bitmap
  font; the kit's label font already is one.
- **Panels are boxes drawn with lines.** Hairline or box-character borders, no fill, a title set
  into the top edge, the way a status line sits in a terminal.
- **Buttons are bracketed words**, `[ RUN ]`, inverted when pressed: the ink and the ground swap.
- **The figures' light becomes the cursor**: a short bright block running along the edge, with
  the phosphor's decay as its tail.
- **The Mandelbulb keeps its render** with the phosphor as its palette: one colour, five stops
  from near-black to the phosphor's white.
- **Motion** is a typing effect on arrival and a slow phosphor decay; flicker and curvature are
  off unless chosen, because text has to be read for minutes.
- **Light mode is paper**: the printout, dark ink on cream, the same shapes.

## Choices open

1. Which phosphor starts: green, amber or white (all three are in the case; the select tries them).
2. Effects: scanlines and glow only, or curvature and flicker as well.
3. Dark only, or paper as the light mode.
4. Whether the site gains a command line as a second way in (type `topics`, `play`), or keeps its navigation only.

## Sources

- [Retro web terminal](https://retro-web-terminal.vercel.app/), [hackertyper.dev](https://www.hackertyper.dev/), [coolretroterminal.com](https://coolretroterminal.com/)
- [cool-retro-term](https://github.com/Swordfish90/cool-retro-term) (the GIFs and stills are from its README)
- [Retro-futuristic UI gallery](https://github.com/Imetomi/retro-futuristic-ui-design) (the three images are from its README)
- [CRT terminal tabs, MIT](https://codefronts.com/navigation/css-tabs/crt-terminal/), [20 CSS retro designs](https://codefronts.com/design-styles/css-retro-designs/)
- [Retro CRT terminal in CSS and JS](https://dev.to/ekeijl/retro-crt-terminal-screen-in-css-js-4afh), [a WebGL CRT front end for a terminal](https://dev.to/remojansen/i-have-open-sourced-a-webgl-front-end-for-your-terminal-that-emulates-a-crt-monitor-2icd)
- [A portfolio run by typed commands](https://github.com/BrijenMakwana/terminal-portfolio), [a fake vintage terminal on CodePen](https://codepen.io/jcubic/pen/BwBYOZ)
