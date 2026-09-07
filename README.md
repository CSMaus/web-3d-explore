# web-3d-explore

![four systems from the fractals series, each drawn by the code in this repository](readme/banner.png)

<sub>left to right: the Barnsley fern from four affine maps played as a chaos game, a dielectric
breakdown figure grown from a point through a relaxed field, the Julia set of
`c = -0.7269 + 0.1889i`, and the Mandelbrot boundary at Seahorse Valley. all four are output of
`math/01-fractals/tools/readme_banner.py`, which rebuilds this image in five seconds.</sub>

two independent tracks live here. they share no code and do not depend on each other.

---

## math/

written and animated content on mathematics and neural-network foundations, aimed at making the
subject visually and intuitively clear to a general audience. a subject is a **topic**, topics are
numbered in reading order, and the words "lesson" and "class" appear nowhere.

| topic | subject | state |
|---|---|---|
| 1 | fractals | built: 69 clips, about twenty minutes |
| 2 | differential equations, attractors and chaos | planned |
| 3 | calculus into a first neural network | planned |
| 4 | tokens, embeddings and generation | planned |

topic 1 is the fractal part of topic 2's subject, built first and out of order. it stands alone
because the series introduces the complex plane from scratch rather than relying on anything
earlier.

### math/01-fractals/ - the video series

eleven topic modules built with [ManimCE](https://www.manim.community/) 0.20.1, rendered at 480p15
preview quality. every number that appears on screen is computed by the scene that shows it and
printed as returned; none are typed in. a dimension quoted in a clip is a dimension the code
measured.

what the series covers, in order: the coastline paradox met as a measurement rather than a riddle,
box-counting dimension checked twice before it is trusted, the Koch curve as an idealised
coastline, the Barnsley fern and iterated function systems, the wider geometric family from Cantor
to the Menger sponge, random growth by dielectric breakdown and by diffusion-limited aggregation,
the complex plane built from nothing, escape-time dynamics and the Julia and Mandelbrot sets, the
boundary under magnification, and a closing analytical layer that derives the dimension formulas
and states the Hausdorff definition.

```sh
cd math/01-fractals
python -m venv .venv && source .venv/bin/activate
pip install -r code2/requirements.txt

manim -pql code2/topic05.py FernIFS          # one scene, previewed
manim -ql code2/topic05.py                   # every scene in a module
```

`manim` also needs a working `ffmpeg` and a LaTeX installation for the equation rendering.

three tools sit beside the scene code:

- `code2/sheet.py` builds a contact sheet of stills from a rendered clip, so a whole beat can be
  judged at once instead of scrubbed.
- `code2/layoutcheck.py` walks a clip frame by frame and reports text that runs off frame, text
  overlapping other text, text sitting on drawn shapes, and text sitting on an image. it found
  eight real layout faults that reading the code had not.
- `tools/fernplay.html` is a single self-contained page with sliders for six systems: iterated
  function systems, L-systems, dielectric breakdown, diffusion-limited aggregation, Julia sets and
  the Mandelbrot set. no build step, no dependencies, open it in a browser.

the rendered clips and manim's intermediate output are not in the repository. every clip is
produced from `code2/` by one command, so what is kept is what makes them.

### math/web-math-fr/ - the website

the same material as pages that can be moved rather than watched, plus the series read as one
continuous page with the reasoning beside each clip.

| | |
|---|---|
| backend | Python 3.12, FastAPI, SQLAlchemy, alembic, PostgreSQL 18, argon2, numpy, Pillow, managed with `uv` |
| frontend | React 19, Vite, TypeScript, TanStack Router, Tailwind v4, zustand, three.js, KaTeX |
| tests | 45 on the backend against a real PostgreSQL, 83 on the frontend |

seven systems have their own page, each carrying its equations, its parameters as controls, a
palette that can be changed, and the dimension measured from whatever is on screen: iterated
function systems, L-systems, dielectric breakdown, diffusion-limited aggregation, Julia sets, the
Mandelbrot set, and the three-dimensional set.

**every calculation that a slider moves runs in the browser.** the escape-time views and the
three-dimensional solid are fragment shaders; the point systems, the rewriting systems and the two
growth models are plain typed code. this is not a cost decision. a server-rendered escape-time
frame at 800 pixels and 300 iterations takes about two seconds, and the same frame on the visitor's
graphics card takes a few milliseconds; no budget turns the first into something a slider can be
dragged against.

one websocket route exists, for the one job that needs it. single precision on a graphics card
carries about seven significant digits, so a browser zoom into the Mandelbrot boundary goes blocky
somewhere past a magnification of 10<sup>5</sup>. past that point the page hands the view to the
server, which renders in double precision and streams four passes back, each four times finer than
the last. measured at 2.1 million times on a 700 by 620 view: first pass on screen at 51 ms, full
resolution at 1.6 s, and the socket closed at 1.63 s, because capacity is allocated for as long as
a connection is held whether or not it is computing.

```sh
cd math/web-math-fr/math-fr-be
docker compose up -d --build        # database on 1586, api on 1585
uv sync && uv run pytest            # needs DB_PASSWORD set

cd ../math-fr-fe
npm ci && npm run dev               # site on 1263
```

the backend comes up from a clean checkout with no environment file present: every setting has a
default, the migrations apply on boot, and no value has to be filled in first. non-default ports
throughout, so nothing collides with whatever else is running.

with the backend stopped, every play page still draws its fractal and says what is missing rather
than failing, because the mathematics is client-side and only the served text is not.

---

## web-s-r/

experiments with real-time web transport and 3D rendering. expected stacks: websockets, webrtc,
three.js, plus whichever backend a given experiment needs. focus areas are fast processing of large
data volumes and rendering at roughly 30 fps under per-request update pressure. nothing is built
here yet.

---

## conventions

- short hyphen only. no em-dash, no en-dash.
- impersonal voice in documents and comments.
- no emoji.
- the fixed colour code across every clip in the series: the object under discussion is blue,
  rulers and scale factors are gold, the dimension is green, and a quantity that runs away without
  bound is coral.
