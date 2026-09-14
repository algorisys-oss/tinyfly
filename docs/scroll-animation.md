# Scroll-driven animation

Scroll animation in tinyfly is a **driver**, not a special kind of timeline.

The engine is a pure function of time: give it a time, it gives you values. A
driver is the boundary where something real-world — a clock, a scroll position,
a drag — becomes a time. `ScrollDriver` does nothing but call `seek()` on an
ordinary timeline, which means every animation you already have can be
scroll-driven without changing it, and a scroll animation still exports to the
same JSON.

```ts
import { VisibilityDriver, ScrollDriver } from '@algorisys/tinyfly/drivers'
```

## Which driver do you want?

**"Play it when it comes into view"** → `VisibilityDriver`. This is the common
case and it is much simpler — no geometry, no scrub maths, just
IntersectionObserver.

**"Tie it to how far I've scrolled"** → `ScrollDriver`.

Each has a one-call form that creates the driver and starts it:

```ts
import { playWhenVisible, scrubOnScroll } from '@algorisys/tinyfly/drivers'

const visible = playWhenVisible({ timeline, trigger: section })   // a started VisibilityDriver
const scrub = scrubOnScroll({ timeline, trigger: panel, scrub: true })  // a started ScrollDriver
```

**Drivers move the playhead; they do not render.** `VisibilityDriver` calls
`timeline.play()`, so something must still tick the timeline and apply its state
(a `Clock` or your own rAF loop).
`ScrollDriver` calls `timeline.seek()`, so apply the state in `onUpdate`:

```ts
new ScrollDriver({
  timeline,
  trigger: panel,
  scrub: true,
  onUpdate: () => adapter.applyState(timeline.getStateAtTime(timeline.currentTime)),
}).start()
```

## VisibilityDriver

```ts
import { VisibilityDriver } from '@algorisys/tinyfly/drivers'

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
import { ScrollDriver } from '@algorisys/tinyfly/drivers'

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

A common fixed-length scrub — `end` starting with `+=` is measured from the start:

```ts
{ start: 'top top', end: '+=500' }    // 500px of scrolling, exactly
{ start: 'top top', end: '+=150%' }   // one and a half viewport heights
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

`onUpdate(progress, velocity)` fires whenever progress or scroll speed changes.
`velocity` is in px/s, positive scrolling down, and returns to 0 (with one more
call) about 120 ms after scrolling stops — enough for skew-on-scroll effects.
`onEnter` / `onLeave` / `onEnterBack` / `onLeaveBack` fire at the edges of the
active range, with `Back` meaning you were scrolling up. A scroll that jumps
across the whole range in one step (a fast flick, or loading the page already
past it) fires both edges, in order.

Without a `timeline`, the driver only reports progress and fires callbacks.

### Nested scrollers

```ts
new ScrollDriver({ timeline, trigger, scroller: document.querySelector('#pane')! })
```

Positions are then measured against that element's box instead of the viewport.

### Performance, and re-measuring

**Scrolling does no layout work.** The driver measures the trigger when it
starts and on window resize, turning `start` and `end` into absolute scroll
offsets. A scroll event then reads only the scroll offset. With `scrub: <seconds>`
its frame loop runs only until the playhead catches up, then stops.

So if layout changes without a resize — images or web fonts loading, content
inserted above the trigger — call `driver.refresh()` (or
`ScrollDriver.refreshAll()` for every driver, in the order they started).
`driver.progress` is the current progress, 0..1; `driver.velocity` the scroll
speed.

On touch devices, resizes that only change the height by less than a quarter
(the address bar showing and hiding) are skipped, so pins do not jump mid-scroll.
`start` and `end` may be functions, called again on every refresh, and
`onRefresh` runs before each re-measure (after the first), which is where
`invalidateOnRefresh` rebuilds an animation.

### Snap, markers and horizontal containers

- **`snap`** takes a progress step, a list of points, a function, or
  `{ snapTo, duration, delay, ease }`. It scrolls to the nearest point once
  scrolling stops inside the range, allowing for the speed scrolling had, and
  stops at once if the person scrolls, touches, clicks or types.
  `snapProgress(progress, velocity, snapTo)` is the pure choice.
- **`markers: true`** draws the start and end lines while developing.
- **`container: { range(), progress(), shiftAt(progress) }`** puts a trigger
  inside something that moves sideways as the page scrolls. `containerProgressAt()`
  is the pure solver, and `live` builds `container` for you from
  `containerAnimation`.

### Smooth scrolling

`SmoothScroll` (and `live.smoothScroll()`) eases wheel scrolling on the page's
real scroll position, so drivers follow it with no setup, and adds `data-speed` /
`data-lag` parallax layers. It rests those layers while drivers measure and
measures them again after pins apply (`ScrollDriver.onRefresh`). See
[Smooth scrolling](./gsap-compat.md#smooth-scrolling).

```ts
const smoother = new SmoothScroll({ smooth: 0.8, effects: true }).start()
```

### Smooth-scroll libraries

Libraries that keep native scrolling (Lenis, and Locomotive Scroll v5 built on
it) fire ordinary `scroll` events, so drivers follow them with no setup. For a
scroller that moves content with transforms instead, push its position:

```ts
virtualScroller.on('scroll', ({ scroll }) => driver.update(scroll))
```

## Pinning

`pin: true` holds the trigger in place for the length of the range; pass an
element to pin something else:

```ts
new ScrollDriver({
  timeline,
  trigger: document.querySelector('.panels')!,
  start: 'top top',
  end: '+=2000',      // stays pinned for 2000px of scrolling
  scrub: true,
  pin: true,
}).start()
```

It is the CSS sticky recipe below, automated. The element is wrapped in a
`div.pin-spacer` as tall as the element plus the pinned distance, and made
`position: sticky` at the offset where the range starts, so content after it is
pushed down by that distance and the browser does the holding. Nothing is
written while scrolling. `destroy()` removes the spacer and restores the
element's styles.

Two things to know:

- Sticky positioning stops working if an ancestor between the element and the
  scroller has `overflow: hidden` or `auto`.
- Create pinned drivers top to bottom. A pin pushes the content below it down,
  and resize refreshes run in start order so later drivers measure after it.

### Doing it by hand

The same effect in plain CSS, if you prefer to own the layout:

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
it.

## With the GSAP-style API

`live` accepts GSAP's `scrollTrigger` vars on a timeline or a single tween, built
on the same driver — see [gsap-compat.md](gsap-compat.md#scroll-triggers).

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

The geometry helpers are exported for the same reason: `parseTrigger(position)`,
`triggerDistance(rect, viewportHeight, position)` (px until a trigger fires,
positive while it is still ahead), `scrollProgress(rect, viewportHeight, start,
end)`, and `smoothToward(current, target, smoothingSeconds, deltaMs)` (the
smoothing behind `scrub: <seconds>`). See the
[API reference](./api-reference.md#drivers).

## Cleaning up

```ts
driver.stop()      // remove listeners, keep the driver usable
driver.destroy()   // stop and release everything
```

Both are safe to call twice.

## See also

- [`docs/gsap-compat.md`](./gsap-compat.md) — how this compares to ScrollTrigger
- [`docs/api-reference.md`](./api-reference.md) — the underlying timeline API
