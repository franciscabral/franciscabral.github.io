# franciscabral.github.io

Personal landing page — AI agent infrastructure and finance systems — plus a
playable p5.js arcade.

Static, dependency-free on the landing page, served by GitHub Pages.

## Layout

```
index.html          landing page
arcade/index.html   the arcade cabinet — play the games here
archive/index.html  index of the original sketches
archive/*/          the original p5 sketches, as first written
vendor/             p5.js 0.7.2 and its addons, shared by arcade and archive
assets/styles.css   neon-arcade stylesheet
assets/arcade.css   the cabinet (marquee, CRT, joystick, buttons)
assets/games.js     the playable games, p5 instance mode
assets/cabinet.js   mounts games into the cabinet, wires the panel
assets/sketches.js  canvas re-cuts used for the hero mosaic and thumbnails
```

## The arcade

`arcade/` is a CSS-built cabinet — marquee, bezelled CRT with scanlines,
joystick and buttons, all boxes and gradients, no images. It hosts four games:

| Game | What it is |
| --- | --- |
| Snake | Walls kill, speed ramps every five fruit, bonus fruit, high score |
| Breakout | New. Bricks, three lives, levels; paddle contact point sets the angle |
| Star Travel | Steerable warp — the vanishing point follows the pointer, hold to boost |
| Life Game | Conway's automaton, paintable, with local seed patterns |

High scores persist in `localStorage`. `arcade/#snake` deep-links to a game.

The games are p5 **instance mode**, which is the reason the cabinet can swap
between them without a page reload: the archived originals are global-mode
sketches (bare `setup()`/`draw()`), and two of those cannot coexist on a page.

They target the vendored **p5 0.7.2** — notably it predates `circle()`, so the
games use `ellipse()`. Check the vendored version before reaching for a newer
p5 API.

## The originals

`archive/` keeps the first versions as they were written. Their script tags now
point at `../../vendor/`, which is the only edit made to them.

The rhythm-game sketch was removed at the author's request.

One pre-existing caveat: the archived `LifeGame` seeds itself from six SVGs on
`upload.wikimedia.org` inside p5's `preload()`. If those are blocked, `preload()`
never resolves, `setup()` never runs, and the page stays blank. The arcade's
Life Game has no external dependency — its patterns are inline — so it always
runs.

## The landing page

`assets/sketches.js` re-implements the four games in plain 2D canvas for the
hero mosaic and thumbnails. That keeps p5 off the landing page entirely. All
instances share one `requestAnimationFrame` loop, pause when scrolled off
screen or when the tab is hidden, and render a single static frame under
`prefers-reduced-motion`.

Each renderer declares a `warmup` step count. Every one of these sketches has an
empty opening frame, so without it a paused or off-screen tile renders as a
black rectangle.

## Editing

No build step — open `index.html` or serve the directory:

```sh
python3 -m http.server 8000
```

Content lives directly in the HTML. Placeholders needing real values are marked
inline with `EDIT:` comments.
