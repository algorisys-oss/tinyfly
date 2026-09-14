# Education animation: tinyfly for teaching

What tinyfly needs to be a first-class tool for **explanatory** animations: the
kind that sit inside a tutorial and show how a slice grows, how a goroutine
hands a value through a channel, or how an HTTP request moves through
middleware.

Written 14 September 2026 against **v0.62.0**. It comes from building a real
consumer: the *Go from Basics to REST APIs* series on teachyourselfcoding.com,
about 20 posts in four languages (en, pt-BR, es, zh-CN), each with inline SVG
animations. Every gap below was hit in a working spike, not imagined.

> **Status (v0.64.0): all 14 gaps are addressed.** See
> [docs/teaching.md](docs/teaching.md) for how to use them, and Phase 30 in
> [todo.md](todo.md) for what was built per item. The workarounds listed at the
> end can be replaced by `tinyfly-embed.iife.js` with `data-tinyfly-auto`.

---

## Positioning

A teaching animation is not a marketing animation. The differences drive
everything below:

| Marketing / UI motion | Teaching animation |
|---|---|
| Plays once, looks good | Played, paused, **stepped** and re-watched |
| Autoplay is the point | The reader controls the pace; autoplay is often wrong |
| Motion is the message | Each **state** is the message; motion only links states |
| No text | Labels, values and a caption per step, in several languages |
| Decorative, can be skipped | Must have a text alternative and work with reduced motion |
| One per page | Five or more per page, in a long article |

These fit tinyfly's principles: API-first, a deterministic engine, and UI kept
loosely coupled. Nothing here puts UI into the engine. Controls ship as a
separate, optional build.

---

## What already works (verified in the spike)

- **The IIFE player drives SVG through the DOM adapter.** A `translateX` on an
  SVG `<g>` is in **user units**, so an animation authored against a
  `viewBox="0 0 720 200"` scales correctly at 390px wide. Measured: the element
  moved 56.7 screen px for 120 units at 340px width, exactly 120 × 340/720.
- `opacity` on SVG `<text>` and `<g>`.
- `seek()` for a scrub bar; `pause()` / `play()`.
- Two players on one page are independent (container-scoped targets).
- No global CSS injected. Small player build (~14 KB gzipped).

---

## Gaps, in priority order

### P0: needed to ship teaching embeds without a wrapper per site

**1. Render a frame on load.**
`create()` + `load()` leaves elements in their raw markup state until the first
`play()`/`seek()`. A figure whose frame-0 keyframe differs from its markup shows
the wrong picture until someone interacts.

- Add `initialFrame: 'start' | 'end' | number` to `PlayerOptions` (default
  `'start'`), applied at the end of `load()`.

**2. Step markers in the JSON format, with a step API.**
Teaching is stepwise: "append 4 → len becomes 4 → cap is full → a new array is
allocated → values copied". Today that needs hand-computed `seek()` times.

- Timeline field: `config.markers: [{ id, time, label? }]`.
- Player: `next()`, `prev()`, `goToMarker(id)`, `currentMarker`, and an
  `onMarker(marker)` callback.
- `stepMode: true`: `play()` runs to the next marker and stops. This is the JSON
  player's equivalent of the GSAP-compat `addPause`, which exists today but only
  in the `live` API.

**3. Reduced motion, built in.**

- `respectReducedMotion: true` (default on for the player): under
  `prefers-reduced-motion: reduce`, never autoplay, and render `initialFrame:
  'end'` (or the first marker) so the figure still shows its final state.
- Listen for changes to the media query, not just a check at load.

**4. Play only when visible.**
A long article with five looping animations runs five rAF loops off-screen.

- `playWhenVisible: true`: an IntersectionObserver pauses the player when it
  leaves the viewport and resumes it if it was playing. Also pause on
  `visibilitychange` (hidden tab). `VisibilityDriver` exists but is not wired
  into the player.

**5. Optional controls build: `tinyfly-controls.iife.js`.**
Every embedder writes the same bar. Ship one, **separate from the engine and
player**, so neither grows.

- Play/pause, ◀ step / step ▶ (uses markers), restart, scrub, speed (0.5× / 1× /
  2×), and a caption line that shows the current marker's label.
- Keyboard: Space toggles, ←/→ step, Home restarts. Focusable, with visible
  focus.
- Styled only through CSS custom properties (`--tf-ctl-fg`, `--tf-ctl-bg`,
  `--tf-ctl-accent`), with no global selectors.
- **Strings passed in**, not hard-coded (`labels: { play, pause, next, prev,
  restart }`). A Chinese page needs Chinese button labels.

**6. SVG-aware properties in the player's adapter.**
`fill` maps to `backgroundColor`, which does nothing on SVG. Highlighting a cell
by colour is the most common teaching move.

- When the target is an `SVGElement`, map `fill`, `stroke`, `stroke-width` and
  `stroke-dashoffset` to the SVG style or attribute. Keep today's mapping for
  HTML elements.

### P1: makes authoring and multilingual publishing pleasant

**7. Discrete text tracks.**
Counters and state labels change in steps: `len = 3` → `len = 4`, `cap = 4` →
`cap = 8`.

- A `text` property on the player (the `text-content` adapter exists), plus
  `easing: 'step'` / `hold` for discrete values, so text never "interpolates".

**8. Captions decoupled from geometry.**
Translating an animation should never touch its timeline. Today the only way is
to put text in the markup.

- `captions: { [lang]: { [markerId]: string } }` in the JSON, or an external
  captions file keyed by marker id. The controls read the page's `lang`.
- Caption changes are announced through an `aria-live="polite"` region, so a
  screen-reader user gets the step-by-step narrative.

**9. Declarative auto-mount.**
A CMS (WordPress, Ghost, static site generators) can paste markup, but inline
init scripts get deferred, combined or stripped by optimisation plugins.

- `<figure data-tinyfly-embed data-options='{"stepMode":true}'>` holding the SVG
  and a `<script type="application/json" data-tinyfly-timeline>`.
- `tinyfly.mountAll(root = document)` mounts every one, and runs automatically
  on `DOMContentLoaded` when the script has `data-tinyfly-auto`. One site-wide
  script tag, zero per-post JavaScript.

**10. Static rendering for no-JS contexts.**
RSS readers, email, print, AMP and search previews show the markup without
running JS.

- CLI or engine function: render the state at each marker (or at `end`) to
  static SVG, e.g. `tinyfly render anim.json figure.svg --at end`. This also
  gives Open Graph thumbnails for free.

**11. A validation command for build pipelines.**
The Go series verifies every code block before publishing. Animations deserve
the same gate.

- `tinyfly validate anim.json --markup figure.svg` must fail when:
  - a track targets a `data-tinyfly` name missing from the markup;
  - markers are unordered or outside the duration;
  - a keyframe time exceeds the duration;
  - a caption references an unknown marker.

### P2: a teaching kit

**12. Diagram primitives** (optional package, helpers only, not engine).
Helpers that emit SVG markup plus tracks for the shapes computer-science
teaching reuses constantly:

- a row of cells (array or slice)
- a pointer arrow that retargets
- stack frames that push and pop
- a queue or channel with a handoff
- a key-value bucket table
- a request travelling through a pipeline

**13. Predict-then-reveal.**
A marker with `pause: true` and a `question` string. The controls show the
question and wait. "What does `len(s)` print now?" Reveal on click. Cheap to
build on markers, and it's the single most effective teaching pattern.

**14. Release hygiene for embedders.**

- Publish **SRI hashes** for each `cdn/*.js` in `cdn/README.md` per release, so a
  pinned jsDelivr URL can be locked with `integrity=`.
- A semver note on the JSON format (`formatVersion`), so embedded timelines
  written against 0.62 keep playing on 0.9x.

---

## Suggested order

1. **1, 3, 6** are small player changes with no new API surface. Do them first.
2. **2 + 5** (markers and the controls build) together; they are one feature from
   a reader's point of view.
3. **9 + 11** (auto-mount and validate) unlock CMS use and CI gates.
4. **8, 7, 4**, then the P2 kit.

## How teachyourselfcoding.com works around these today

So the series is not blocked, the site carries a thin wrapper that should shrink
as the items above land:

- a WordPress snippet loads the **pinned** player build in the footer, only on
  posts that contain `tyc-anim`;
- a small controller adds play/pause, step, restart and scrub; seeks to frame 0
  after load (gap 1); pauses off-screen (gap 4); and under reduced motion seeks
  to the end instead of autoplaying (gap 3);
- colour highlights use opacity cross-fades between two stacked shapes instead
  of `fill` (gap 6);
- the steps are written out in the prose and in a caption under each figure, so
  the text stands alone (gaps 8 and 10).

Every workaround here is a feature request above.
