# Scroll-driven animation

Scroll animation in tinyfly is a **driver**, not a special kind of timeline.

The engine is a pure function of time: give it a time, it gives you values. A
driver is the boundary where something real-world — a clock, a scroll position,
a drag — becomes a time. `ScrollDriver` does nothing but call `seek()` on an
ordinary timeline, which means every animation you already have can be
scroll-driven without changing it, and a scroll animation still exports to the
same JSON.

```ts
import { VisibilityDriver, ScrollDriver } from 'tinyfly/drivers'
```

## Which driver do you want?

**"Play it when it comes into view"** → `VisibilityDriver`. This is the common
case and it is much simpler — no geometry, no scrub maths, just
IntersectionObserver.

**"Tie it to how far I've scrolled"** → `ScrollDriver`.

## VisibilityDriver

```ts
import { VisibilityDriver } from 'tinyfly/drivers'

const driver = new VisibilityDriver({
  timeline,
  trigger: document.querySelector('#section')!,
  behaviour: 'once',   // 'once' | 'repeat' | 'reset'
  threshold: 0.25,     // fraction visible before it counts
})
driver.start()
```

| `behaviour` | What happens |
|---|---|
| `once` (default) | Plays the first time it appears, never again |
| `repeat` | Rewinds and plays on every appearance |
| `reset` | Plays on appear, rewinds when it leaves |

Options: `rootMargin` and `root` pass through to IntersectionObserver;
`onEnter` / `onLeave` fire on every crossing regardless of behaviour.

Where `IntersectionObserver` does not exist (SSR, a worker, an old browser) the
driver plays immediately — better to show the animation than to leave it stuck
on frame 0 forever.

Call `driver.reset()` to let a `once` driver fire again.

## ScrollDriver

```ts
import { ScrollDriver } from 'tinyfly/drivers'

const driver = new ScrollDriver({
  timeline,
  trigger: document.querySelector('#panel')!,
  start: 'top bottom',   // when the panel's top hits the viewport's bottom
  end: 'bottom top',     // when the panel's bottom hits the viewport's top
  scrub: true,
})
driver.start()
```

The driver pauses the timeline when it starts — scroll position is now the only
thing advancing it.

### Trigger positions

A position is `"<element edge> <viewport edge>"`:

```
'top bottom'      the element's top reaching the viewport's bottom
'center center'   the element's middle at the viewport's middle
'bottom top'      the element's bottom reaching the viewport's top
'25% 75%'         percentages work for either edge
'top top+=400'    400px past that point
'top bottom-=100' 100px before it
300               a bare number: 300px down from the element's top
```

Keywords: `top`/`left`/`start` (0), `center`/`centre`/`middle` (0.5),
`bottom`/`right`/`end` (1). A single token is read as the element edge with the
viewport edge defaulting to `top`.

A common fixed-length scrub:

```ts
{ start: 'top top', end: 'top top+=500' }   // 500px of scrolling, exactly
```

### Scrub modes

```ts
scrub: true    // playhead tracks scroll exactly — snappy, frame-accurate
scrub: 0.5     // playhead eases toward the scroll position over ~0.5s
```

Smoothing feels nicer but makes the displayed time frame-rate dependent, since
it advances by elapsed time. `scrub: true` is the exact path; use it when the
animation needs to land on specific frames.

### Callbacks

`onUpdate(progress)` fires whenever progress changes. `onEnter` / `onLeave` /
`onEnterBack` / `onLeaveBack` fire at the edges of the active range, with
`Back` meaning you were scrolling up.

### Nested scrollers

```ts
new ScrollDriver({ timeline, trigger, scroller: document.querySelector('#pane')! })
```

Positions are then measured against that element's box instead of the viewport.

### Forcing a re-measure

If you change layout yourself, call `driver.sample()`. The driver already
re-samples on `scroll` and `resize`.

## Pinning

**There is no pin option, on purpose.** Pinning mutates page layout — it
repositions the element and inserts a spacer to preserve scroll height — and
that is where most of ScrollTrigger's complexity lives. CSS already does the
common case:

```html
<div class="pin-container">
  <div class="pin-target">…animated content…</div>
</div>
```

```css
.pin-container { height: 300vh; }          /* how long the pin lasts */
.pin-target    { position: sticky; top: 0; height: 100vh; }
```

Then drive the animation off the container:

```ts
new ScrollDriver({
  timeline,
  trigger: document.querySelector('.pin-container')!,
  start: 'top top',
  end: 'bottom bottom',
  scrub: true,
})
```

The element sticks for the container's height while the timeline scrubs across
it. If you hit a case this genuinely cannot express, that is the signal to
revisit a real pin implementation — see Phase 26A in [todo.md](../todo.md).

## Authoring in the editor

Click **⇅ Scroll** in the preview header to switch the preview into scroll-scrub
mode. A scrollable strip appears with a trigger element inside it; scroll the
strip and the animation scrubs.

This is not a simulation. The preview attaches a real `ScrollDriver` to a real
scroll container, so a start/end pair tuned here behaves identically on your
page. The panel shows the exact snippet to reproduce what you are looking at:

- **Start** / **End** — the trigger positions, from the same grammar above
- **Scrub** — `exact`, or a smoothing time
- **Runway** — how much space sits above and below the trigger
- A live progress percentage, and the code to paste

Normal playback is paused while the mode is on, because scroll position is the
only thing that should be moving the playhead — the same as in production.

## Determinism

A driver is not a hole in the determinism guarantee. The engine is deterministic
*given a time*; it was never deterministic given a wall clock, and the existing
rAF `Clock` already reads real time. A scroll driver is the same kind of
boundary — and `scrollProgress()` itself is a pure function of geometry, unit
tested without a browser.

## Cleaning up

```ts
driver.stop()      // remove listeners, keep the driver usable
driver.destroy()   // stop and release everything
```

Both are safe to call twice.

## See also

- [`docs/gsap-compat.md`](./gsap-compat.md) — how this compares to ScrollTrigger
- [`docs/api-reference.md`](./api-reference.md) — the underlying timeline API
