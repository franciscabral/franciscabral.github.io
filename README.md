# franciscabral.github.io

Personal landing page — AI agent infrastructure and finance systems.

Static, dependency-free, served by GitHub Pages.

## Layout

```
index.html          landing page
archive/index.html  the p5.js sketch archive
archive/*/          the four original sketches, unmodified
assets/styles.css   neon-arcade stylesheet
assets/sketches.js  canvas re-cuts of the sketches (hero mosaic + thumbnails)
```

## The sketches

The four p5.js sketches this repo started as — Star Travel, Life Game, Rhythm
Style and Snake — moved to `archive/` along with `p5.min.js` and `addons/`, so
their `../p5.min.js` script tags still resolve and every sketch still runs
exactly as written. Nothing in `archive/*/` was edited.

One caveat, pre-existing and not caused by the move: `LifeGame` seeds itself
from six SVGs on `upload.wikimedia.org`, loaded inside p5's `preload()`. If
those requests are blocked or slow, `preload()` never resolves, `setup()` never
runs, and the page stays blank — the other three sketches have no external
dependencies. Making those loads non-blocking with a random-seed fallback would
fix it, at the cost of editing archived source.

`assets/sketches.js` re-implements all four in plain 2D canvas for the hero
mosaic and the archive thumbnails. That keeps ~460 KB of p5 off the landing
page, and means the previews can't break when the archive moves. All instances
share one `requestAnimationFrame` loop, pause when scrolled off screen or when
the tab is hidden, and render a single static frame under
`prefers-reduced-motion`.

## Editing

No build step — open `index.html` or serve the directory:

```sh
python3 -m http.server 8000
```

Content lives directly in `index.html`. Placeholders needing real values are
marked inline with `EDIT:` comments.
