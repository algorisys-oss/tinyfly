# GSAP compatibility layer

`tinyfly/gsap-compat` gives GSAP-literate developers a syntax they recognise.

**It is familiar, not compatible.** GSAP code will not run unchanged against it,
and it is not a drop-in replacement. What it does is *desugar* a GSAP-shaped API
into ordinary tinyfly tracks: every call you make compiles to plain keyframe
data and is handed to a normal `Timeline`. Anything you author through it opens
in the editor, exports to JSON, and plays in the standard player.

If you want the full picture of what tinyfly can and cannot do relative to GSAP,
read ["What we deliberately don't do"](#what-we-deliberately-dont-do) at the
bottom — several of the gaps are principled choices, not missing work.

## Install and import

```ts
import { tf, timeline } from 'tinyfly/gsap-compat'
```

The engine is a peer import, so you get one copy of `Timeline` whether you
import `tinyfly`, `tinyfly/gsap-compat`, or both.

## A first animation

```ts
import { timeline } from 'tinyfly/gsap-compat'
import { quickPlay } from 'tinyfly/gsap-compat'

const tl = timeline()
tl.fromTo('box', { x: 0, opacity: 0 }, { x: 200, opacity: 1, duration: 1, ease: 'power2.out' })
tl.to('box', { rotate: 180, duration: 0.5 }, '-=0.25')

quickPlay({ timeline: tl.timeline, targets: { box: '#my-box' } })
```

`quickPlay` is worth knowing about on its own: it wires a timeline to the DOM
and runs the rAF loop, replacing the dozen lines of boilerplate every
hand-written tinyfly example starts with.

## Playing on real elements: `live`

> Thirty-three runnable demos are on the Examples page under **GSAP-style**
> (`/examples?category=gsap`), each with its code and **Copy code**: motion
> paths and orbits, shape and menu morphs, scrambled and typed text, dashboard
> stats, Flip layouts (shuffle, filter, layout switch, expand), draggable throws (slots, carousel, swipe cards), friction, stagger,
> labels, 3D card flips, composition, playback controls, baked eases, and
> interaction effects like a magnetic button, proximity grid, dock
> magnification, velocity skew, card stack, infinite marquee, split-text reveal
> and SVG line drawing.
>
> **Doing without `overwrite`.** Interactive effects start a new tween on every
> pointer move. Keep the returned timeline and `kill()` it before starting the
> next one on the same element (see *Proximity Grid*), so tweens never pile up.

`timeline()` and `tf` *compile*: targets are names, and playback is yours to
wire. `live` compiles the same way and then plays the result on the page:

```ts
import { live } from 'tinyfly/gsap-compat'

live.to('.box', { x: 200, duration: 1, ease: 'power2.out' })
live.from('.card', { opacity: 0, y: 30, duration: 0.6, stagger: 0.1 })

const tl = live.timeline({ repeat: -1, yoyo: true })
  .to('#a', { x: 120, duration: 0.5 })
  .to('#b', { rotate: 180, duration: 0.5 }, '<')

tl.pause()          // play, pause, resume, restart, reverse, seek, progress, timeScale, kill
tl.toDefinition()   // the same plain JSON the compiler produces
```

Without a build step, the all-in-one bundle exposes the same functions on a
global — `tinyfly.to()`, `tinyfly.timeline()` and so on:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.56.0/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

What `live` adds, all of it runtime rather than compilation:

| | `timeline()` / `tf` | `live` |
|---|---|---|
| Targets | Names | CSS selectors, elements, node lists, or arrays of them |
| Many matches | — | A selector matching several elements animates all of them; `stagger` fans them out |
| Playback | You call `quickPlay` or drive `tick()` | Starts on the next microtask; `paused: true` opts out |
| Return value of `to()` etc. | A tween handle | The timeline, so calls chain |
| Tween-level `repeat`, `yoyo`, `onStart`, `onUpdate`, `onComplete` | On `timeline()` | Also accepted in `live.to(target, vars)` |
| Start value of a `to()` | Resolution chain | Resolution chain, with **the value tinyfly last applied to that element** inserted before `defaults` |

**Autoplay waits a microtask** so every tween chained synchronously onto a
timeline is in place before it starts. Calling `play`, `pause`, `seek` or
`progress` before then takes control, and autoplay is cancelled.

**Concurrent animations compose.** Every `live` animation shares one frame loop
and one DOM adapter, which merges values per element before writing. So

```ts
live.to('#box', { x: 200, duration: 1 })
live.to('#box', { rotate: 90, duration: 1 })
```

moves *and* turns the box. (Two separate `quickPlay` calls would each write a
`transform` missing the other's property.) When two animations drive the *same*
property at the same time, the one played most recently wins. A finished
animation's final values are kept, so later tweens compose with them and start
from them.

**Tweens read the DOM once, when they are built — never per frame.** The start
value `live` adds comes from what tinyfly last applied. Beyond that, a tween
reads the page only where GSAP's option names something on the page: a shape's
current path (`morphSVG`), an element's current text (`text`, `scrambleText`),
and a path's geometry and the follower's layout (`motionPath` with `align`).
Whatever it reads is written into the compiled tracks as plain values, so the
JSON still describes the animation completely. It never reads
`getComputedStyle`: an element styled by CSS alone starts numeric and colour
properties from the static defaults, so use `fromTo` for the first tween on
those.

Two features measure the page by design, outside that rule. [Flip](#flip)
measures layout once per `getFlipState` call and once per `flipFrom` call (which
`live.flip` makes one each of). `live.draggable` re-measures an element `bounds`
on each press and follows pointer events for the whole drag. Both still hand the
engine plain values: Flip compiles to ordinary tweens, and a throw is an ordinary
inertia tween.

**Plain objects are targets too.** Pass any JavaScript object and its
properties are tweened and assigned straight back onto it — no element, no
adapter. That is how a canvas, a Three.js scene or a shader uniform follows the
same timeline as the DOM:

```js
const scene = { radius: 30, color: '#4a9eff' }
live.to(scene, { radius: 90, color: '#ec4899', duration: 1.4, ease: 'expo.inOut' })
live.to(mesh.position, { x: 2, y: 1, duration: 1 })        // Three.js
live.to(material.uniforms.uProgress, { value: 1, duration: 2 })
```

Each object starts from its own current values, read when the tween is built.
Numbers, colour strings and number arrays animate. Arrays and `NodeList`s are
lists of targets, not objects to animate. Objects and elements mix freely in one
timeline.

**The ticker** runs a callback every frame, after that frame's values are
applied, with GSAP's arguments — `time` in seconds since the ticker started,
`deltaTime` in milliseconds, and a `frame` counter:

```js
const render = (time, deltaTime, frame) => renderer.render(threeScene, camera)
live.ticker.add(render)
live.ticker.remove(render)
```

The frame loop keeps running while any callback is registered, even with no
animation playing, and stops when the last one is removed. In a script tag it is
`tinyfly.ticker`.

**Separate stages.** `createLive(new Stage())` gives an isolated loop and
adapter — useful for tests (pass a `scheduler`), or for a widget that should not
compose with the rest of the page. `new Stage({ root })` resolves selectors inside
`root` only. `stage.tick(ms)` drives it by hand.

Elements stay registered with the stage once animated. For long-lived single-page
apps that create and discard many elements, use a `Stage` per view and call
`stage.destroy()` when the view goes away. It stops everything on that stage,
releases its elements, and ignores any autoplay still queued.

## Mapping table

| GSAP | tinyfly/gsap-compat | Notes |
|---|---|---|
| `gsap.to(t, vars)` | `tl.to(t, vars)` | Start value resolved, not read from the DOM — see below |
| `gsap.from(t, vars)` | `tl.from(t, vars)` | |
| `gsap.fromTo(t, a, b)` | `tl.fromTo(t, a, b)` | The only form with no implicit start value |
| `gsap.set(t, vars)` | `tl.set(t, vars)` | Compiles to one held keyframe |
| `gsap.timeline()` | `timeline()` | |
| `tl.add(child, pos)` | `tl.add(child, pos)` | Flattened at compile time |
| `tl.addLabel(name)` | `tl.addLabel(name)` | |
| Position `"+=1"` / `"-=0.5"` | same | Seconds, relative to the timeline end |
| Position `"<"` / `">"` | same | Start / end of the previous tween |
| Position `"<0.2"` / `">+=0.2"` | same | Offset from the previous tween |
| Position `"label+=1"` | same | |
| `stagger: 0.1` | same | Compiles to one multi-target track |
| `stagger: { each, amount, from }` | same | `from`: start/end/center/edges/index |
| `repeat` / `yoyo` | `repeat` / `yoyo` on `timeline()` | → `loop` / `alternate` |
| `repeatDelay` | `repeatDelay` on `timeline()` | |
| `timeScale()` | `timeScale()` | → `config.speed` |
| `progress()` | `progress()` | |
| `seek(t)` / `seek('label')` | same | Seconds |
| `play/pause/reverse/restart/kill` | same | |
| Tween `.kill()` | handle returned by `to()` etc. | Removes only that tween's tracks |
| `motionPath: { path, autoRotate, start, end }` | same | Compiles to a motion-path track — see [Motion paths](#motion-paths) |
| `motionPath: [{x, y}, …]` + `curviness` | same | Points become a smooth path at build time |
| `motionPath: { path: '#el', align: '#el', alignOrigin }` | `live` only | Element read once, when the tween is built |
| `morphSVG: 'M…'` | same | Compiles to a `d` track — see [Shape morphing](#shape-morphing) |
| `morphSVG: '#shape'` / element | `live` only | Target shape and each element's current shape read when built |
| `MorphSVGPlugin.convertToPath()` | `live.convertToPath()` | |
| `text: 'Hi'` / `{ value, rightToLeft }` (TextPlugin) | same | Compiles to a text track — see [Text](#text) |
| `scrambleText: 'Hi'` / `{ text, chars, revealDelay, speed, tweenLength, rightToLeft }` | same | Seeded, so it replays identically |
| `inertia: { x: { velocity, min, max, end, resistance } }` | same | Compiles to inertia tracks — see [Inertia](#inertia-and-dragging) |
| `Draggable.create(el, { inertia: true, bounds, snap })` | `live.draggable(el, { inertia, bounds, snap })` | Throw uses the release velocity |
| `Flip.getState(t)` / `Flip.from(state, vars)` | `live.getFlipState(t)` / `live.flipFrom(state, vars)` | See [Flip](#flip) |
| `Flip.fit`, `absolute`, `nested` | — | Not yet; see Flip limits |

Units: the facade speaks **seconds**, like GSAP. Everything it stores is in
**milliseconds**, like the engine. The conversion happens at the boundary and
nowhere else.

## Easing

Most GSAP eases map to an exact built-in or a close cubic-bezier:

| GSAP | Result |
|---|---|
| `none`, `linear` | `linear` |
| `power1.*`, `power2.*` | Exact built-ins: `power1` is quad, `power2` is cubic, as in GSAP |
| `power3.*`, `power4.*`, `sine.*`, `expo.*`, `circ.*`, `back.*` | Cubic-bezier |
| `elastic.*`, `bounce.*`, `steps(n)` | **Needs baking** — see below |

GSAP 2 spellings (`Power2.easeOut`) and bare families (`power2`, which defaults
to `.out`) are both accepted. An unrecognised name falls back to `ease-out`
rather than throwing.

### Eases that must be baked

Elastic, bounce and steps overshoot or jump. No single cubic-bezier can express
that, because a bezier ease is monotonic and these are not. Two options:

```ts
// Default: warns, falls back to a smooth curve.
const tl = timeline({ onWarning: console.warn })

// Opt in: samples the ease into intermediate keyframes.
const tl = timeline({ bakeEases: true, bakeIntervalMs: 1000 / 60 })
```

Baking keeps the output portable — a player reading the JSON needs no elastic
implementation — at the cost of many more keyframes. That is why it is off by
default.

For a real spring rather than an elastic *ease*, use a
[spring track](#springs) instead; it is one line of parameters rather than a
hundred baked keyframes.

## The implicit start value

This is the single biggest behavioural difference, and it is deliberate.

GSAP's `to()` reads the element's current computed style to find where to
animate *from*. tinyfly cannot: reading live DOM state would make the same
animation JSON play differently depending on the page's CSS, which breaks the
determinism the engine is built on.

So a start value is resolved in this order:

1. An explicit `from` (i.e. you used `fromTo`) — always wins.
2. The last value authored for that target+property on this timeline.
3. A `defaults` map passed to `timeline({ defaults })`.
4. The documented static default (`opacity: 1`, `x: 0`, `scale: 1`, …).

Reaching step 4 is where GSAP users get surprised, so the facade tells you:

```ts
const tl = timeline({ onWarning: (message) => console.warn(message) })
tl.to('box', { x: 100, duration: 1 })
// gsap-compat: no start value for "x" on "box" — using the static default 0.
// GSAP would read the live DOM here; tinyfly cannot, so pass an explicit
// fromTo() or a defaults map.
```

**Recommendation: use `fromTo` for the first tween on any property.** After
that, step 2 chains naturally and you can use `to` freely.

## What we deliberately don't do

These are not on a roadmap. Each conflicts with a principle the project is built
on, and the alternative given is the principled equivalent.

Several of these are now **reopened for consideration** in Phase 27 of
[todo.md](https://github.com/algorisys-oss/tinyfly/blob/main/todo.md), with designs that resolve values once at load rather than
per frame — which keeps the JSON a complete description of the animation. The
reasoning below is still the bar any such proposal has to clear.

| Not supported | Why | Instead |
|---|---|---|
| Runtime function values (`x: () => Math.random() * 100`) | Cannot serialize; different every run | Compile-time `"random(-100, 100)"` with a recorded seed — see [authoring values](#compile-time-values) |
| `repeatRefresh` | Same reason | — |
| Implicit `getComputedStyle` start values | Breaks determinism | The resolution chain above |
| `overwrite: 'auto'` | Needs live tween objects mutating each other | `timeline.removeTracks(filter)`, and `findConflicts()` to detect overlaps |
| Plugins (ScrollTrigger, Draggable, Flip, MorphSVG…) | A plugin system would let arbitrary code into the evaluation path | Built in as first-class features — see below |
| `gsap.utils.*`, `matchMedia`, `context`, `quickSetter` | Out of scope for an animation engine | Host-app concerns |
| Function eases | Cannot serialize | Named ease, or `{ type: 'cubic-bezier', points }` |

### The plugin equivalents

What GSAP sells as plugins, tinyfly ships as ordinary features:

| GSAP plugin | tinyfly |
|---|---|
| ScrollTrigger | `scrollTrigger` on `live` (scrub, pin, toggleActions) — see [Scroll triggers](#scroll-triggers); [`tinyfly/drivers`](./scroll-animation.md) underneath, plus a scroll-scrub preview in the editor |
| Draggable / Observer | `live.draggable()`, and `tinyfly/interaction` — `Draggable`, `Observer` |
| InertiaPlugin | The `inertia` tween option and inertia tracks — see [Inertia](#inertia-and-dragging) |
| Flip | `live.flip()` / `live.getFlipState()` + `live.flipFrom()` — see [Flip](#flip); `flip()` in the DOM adapter for authoring |
| MorphSVG | The `morphSVG` tween option — see [Shape morphing](#shape-morphing) |
| MotionPathPlugin | The `motionPath` tween option — see [Motion paths](#motion-paths) |
| DrawSVG | The `drawSVG` tween option — see [Line drawing](#line-drawing) |
| SplitText | `live.splitText()` — see [Split text](#split-text); text splitting in the editor |
| `gsap.ticker` | `live.ticker` — see [Playing on real elements](#playing-on-real-elements-live) |
| TextPlugin | The `text` tween option — see [Text](#text) |
| ScrambleTextPlugin | The `scrambleText` tween option — see [Text](#text) |
| Physics2D | [Spring](#springs) and [inertia](#inertia-and-dragging) tracks — deterministic and serializable |

## Motion paths

GSAP's `motionPath` option works on `timeline()`, `tf` and `live`:

```ts
live.to('.plane', {
  motionPath: { path: '#route', align: '#route', autoRotate: true },
  duration: 3,
  ease: 'power1.inOut',
})
```

| Option | Meaning |
|---|---|
| `path` | SVG path data, an array of `{ x, y }` points, or (in `live`) a selector / element: `<path>`, `<circle>`, `<ellipse>`, `<rect>`, `<line>`, `<polyline>`, `<polygon>` |
| `curviness` | For points: `0` straight lines, `1` a natural curve (default), higher bows further |
| `autoRotate` | `true` to face along the path; a number also adds that many degrees |
| `start`, `end` | The part of the path to travel, 0–1 (defaults 0 and 1) |
| `align` | `live` only. Lay the path over an element — `true` for the path element itself — so the follower moves along it where it is drawn |
| `alignOrigin` | `live` only. The follower's point that sits on the path, as fractions of its size (default `[0.5, 0.5]`) |

**How it compiles.** One motion-path track, whose keyframes are progress along
the path (eased like any other tween, and baked for elastic/bounce when
`bakeEases` is on). Stagger fans several followers along the same path.
`from()` travels it backwards.

**Without `align`**, path coordinates are x/y offsets from where the follower is
laid out. **With `align`**, `live` measures once, when the tween is built: the
path element's position and scale on the page (its screen matrix) and the
follower's layout box (ignoring its own transform). The result is stored as a
`matrix` on the track, so the JSON still says exactly where the follower goes.
If the page re-flows later, build the tween again.

Rotation happens about the follower's CSS `transform-origin`. With a non-centre
`alignOrigin`, set `transform-origin` to match.

The parser handles what design tools export: every command, absolute or
relative, compact numbers (`10-20`, `.5.5`), exponents, and arc flags without
separators. Followers move at an even speed along curves.

## Shape morphing

GSAP's `morphSVG` option works on `timeline()`, `tf` and `live`:

```ts
const [shape] = live.convertToPath('#circle')   // a <circle> has no `d` to animate
live
  .timeline({ repeat: -1 })
  .to(shape, { morphSVG: '#star', duration: 1 })
  .to(shape, { morphSVG: '#heart', duration: 1 }, '+=0.5')
```

- **In `live`**, `morphSVG` takes a selector, an element (path or any basic shape)
  or path data. Each element starts from the shape it currently draws, or the
  shape tinyfly last gave it, so chained morphs follow on. Several elements each
  morph from their own shape, and a numeric `stagger` is honoured.
- **In `timeline()` / `tf`**, `morphSVG` takes path data, and the start must be
  known: `fromTo({ d: … }, { morphSVG: … })`, or an earlier morph on the same
  target. Morphing from nothing throws, with a message saying so.
- **`live.convertToPath(targets)`** replaces circles, ellipses, rects, lines,
  polylines and polygons with equivalent `<path>` elements, keeping class, fill and
  other attributes. It changes the document, so it is an explicit call.

How the engine matches two shapes so the morph looks intentional:

| | |
|---|---|
| **Start point and direction** | For closed shapes, every rotation of the target's points and both windings are tried; the one that moves points least (about each shape's centre) wins. The equivalent of GSAP's `shapeIndex: "auto"`. |
| **Corners** | Samples always include every corner of both shapes, so star points and square corners stay sharp mid-morph. |
| **Holes** | Paths with the same number of subpaths morph subpath-to-subpath, so a letter's counter stays a hole. Otherwise the whole path is one run. |
| **Open paths** | Stay open; only both directions are tried. |
| **Ends** | At progress 0 and 1 the original path strings are returned exactly. |

Plans are cached per pair of shapes, so the matching runs once; each frame only
blends points.

## Line drawing

`drawSVG` animates how much of an SVG stroke is drawn:

```js
live.from('.line', { drawSVG: 0, duration: 1 })                   // draw in
live.to('.line', { drawSVG: '40% 60%', duration: 0.6 })           // shrink to the middle
live.fromTo('path', { drawSVG: '50% 50%' }, { drawSVG: true, stagger: 0.1 })  // grow out from the centre
```

| Value | Drawn |
|---|---|
| `true` / `false` | All of it / none |
| `120` | The first 120px |
| `'60%'` | The first 60% |
| `'20% 80%'`, `'10 50%'` | From one point to the other (px and % mix) |

`live` measures each element's length once (`getTotalLength()`), so shapes of
different lengths draw over the same duration, and compiles the draw to two
ordinary tracks — `strokeDasharray` as `[visible, length]` and `strokeDashoffset`
as `-start`. A `to()` on a stroke tinyfly has not drawn starts fully drawn. It
works on anything with a stroke length: `path`, `line`, `polyline`, `polygon`,
`circle`, `ellipse`, `rect`. It replaces any dash pattern the element had, and
with `stroke-linecap: round` an empty segment still shows a dot.

`timeline()` / `tf` have no page to measure and throw on `drawSVG`; use
`drawSvgProperties(value, length)` to get the two values yourself.

## Text

GSAP's TextPlugin and ScrambleTextPlugin options work on `timeline()`, `tf` and `live`:

```ts
live.to('.title', { text: 'Hello world', duration: 1, ease: 'none' })        // types it
live.to('.title', { text: { value: '', rightToLeft: true }, duration: 0.4 })  // backspaces it
live.to('.code', { scrambleText: { text: 'granted', chars: 'numbers', revealDelay: 0.3 }, duration: 1 })
```

| `scrambleText` option | Meaning |
|---|---|
| `text` | The text to end on |
| `chars` | `upperCase` (default), `lowerCase`, `upperAndLowerCase`, `numbers`, or your own characters |
| `revealDelay` | Seconds before characters start to settle |
| `speed` | How fast random characters change; 1 = 20 per second |
| `tweenLength` | Grow or shrink the length over the tween (default `true`) |
| `rightToLeft` | Settle from the end |
| `seed` | Fix the random sequence (by default derived from the target and text) |

**Where the text starts.** In `live`, from the element's current text (or the
text tinyfly last set), so chains follow on and each of several elements starts
from its own. In `timeline()` / `tf`, from the text this timeline last set, or
empty; `fromTo({ text: … }, …)` sets it explicitly.

**Deterministic scramble.** The "random" characters are a hash of the seed, the
character's position and the refresh step — never `Math.random` — so scrubbing
backwards shows exactly what playing forwards did, and an exported animation
scrambles the same everywhere.

**How it compiles.** A text track: keyframes are eased progress (0–1), and the
track's `textConfig` holds the start and end text and the options. The timeline
turns progress into the string, and adapters set it as the element's text.
Spaces stay spaces while scrambling, so word shapes remain readable.

`text` replaces the element's text content. Markup inside it (spans, links) is
replaced too; animate an inner element if you need to keep the rest.

## Scroll triggers

`scrollTrigger` on `live.timeline()` or a single `live` tween ties it to
scrolling, with GSAP's option names. It is built on
[`ScrollDriver`](./scroll-animation.md), so scrolling does no layout reads.

```js
// Scrub: scroll position is the playhead. Pin the section while it plays.
live.timeline({
  scrollTrigger: { trigger: '.panels', start: 'top top', end: '+=2000', scrub: 0.5, pin: true },
})
  .to('.track', { x: -1600, ease: 'none' })

// Toggle: play when the card comes into view, reverse when scrolling back above it.
live.from('.card', {
  y: 60, opacity: 0, duration: 0.8,
  scrollTrigger: { start: 'top 80%', toggleActions: 'play none none reverse' },
})

// No animation: just callbacks, e.g. skew by scroll speed.
live.scrollTrigger({
  trigger: '.gallery',
  onUpdate: ({ velocity }) => live.to('.gallery img', { skewY: velocity / -300, duration: 0.4 }),
})
```

| Option | |
|---|---|
| `trigger` | Element or selector; default the animation's first target |
| `start`, `end` | `"<element edge> <viewport edge>"` as in [trigger positions](./scroll-animation.md#trigger-positions); `end: '+=600'` / `'+=150%'` is measured from the start. Defaults `'top bottom'`, `'bottom top'`. A function is called again on every refresh |
| `invalidateOnRefresh` | On every refresh (a resize), rebuild the animation so function values and start values are read again |
| `scrub` | `true`: progress follows scroll exactly. A number: smoothed over that many seconds |
| `pin` | `true` pins the trigger for the range, or an element / selector to pin instead (see [pinning](./scroll-animation.md#pinning)) |
| `scroller` | A scrolling element or selector instead of the window |
| `toggleActions` | Without `scrub`: actions on enter, leave, enter back, leave back — `play`, `pause`, `resume`, `reverse`, `restart`, `reset`, `complete` or `none`. Default `'play none none none'` |
| `once` | Stop watching after the first enter |
| `onUpdate(self)` | `self` is `{ progress, velocity, direction }`; velocity in px/s, back to 0 when scrolling stops |
| `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` | Edge callbacks |

A timeline with `scrollTrigger` does not autoplay, and without `scrub` it shows its
starting state straight away, so a `from()` reveal never flashes its end state.
The trigger attaches on the next microtask, after the tweens chained onto the
timeline. `tl.scrollTrigger` is the driver (`refresh()`, `progress`, `velocity`);
`tl.kill()` removes it and its pin, as does destroying the stage.
`live.refreshScroll()` re-measures every trigger after a layout change a resize
would not catch.

On touch devices, resizes that only change the height a little (the address bar
showing and hiding) do not refresh, so pins do not jump mid-scroll.

Not supported yet: `snap`, `markers` and `containerAnimation` (planned), and
`pinSpacing: false`, `anticipatePin`, horizontal scrollers.

## Values that change every event: `quickTo`

Pointer followers, magnetic buttons and scroll-velocity effects change a value on
every event. Creating a tween per event works, but it allocates on every move and
leaves overlapping tweens to compose. `live.quickTo` makes one reusable tween per
property instead:

```js
const moveX = live.quickTo('.cursor', 'x', { duration: 0.5, ease: 'power3.out' })
const moveY = live.quickTo('.cursor', 'y', { duration: 0.5, ease: 'power3.out' })
window.addEventListener('pointermove', (e) => { moveX(e.clientX); moveY(e.clientY) })

const pull = live.quickTo(button, 'x', { spring: 'snappy' })   // springs keep their momentum
```

- Each call re-targets the tween from the value on screen now, so there is no jump.
- Nothing is written until the next frame, so several calls in one frame cost
  one write.
- With `spring`, each re-target carries the current velocity.
- The setter uses the first element the target matches. `moveX.tween` is the
  reused timeline, and `moveX.kill()` stops it.

## Surviving resizes

Anything measured from the page — a pinned section's travel, a marquee's width —
changes when the window resizes or a phone rotates. Pass **functions** instead of
numbers and they are called again whenever the animation is rebuilt:

```js
const travel = () => track.scrollWidth - section.clientWidth

live.timeline({
  scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${travel()}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
})
  .to(track, { x: () => -travel(), ease: 'none' })
```

- **Function values** in tween vars are called with `(index, target)` when the
  tween is built. When they differ per target, each target gets its own tween.
- **`tl.invalidate()`** rebuilds a timeline from the same calls. It rewinds to
  the start, so start values are read from elements before the timeline changed
  them, re-runs every function value, and returns to the same progress. Call it
  yourself for animations without a scroll trigger, e.g. on `resize`.
- **`invalidateOnRefresh: true`** does that on every scroll refresh, before start
  and end are measured again.

## Responsive setups, reduced motion and cleanup

**`live.context(fn, scope?)`** collects everything the live API creates while `fn`
runs:

- timelines and tweens, with their scroll triggers and pins;
- split text and draggables;
- stand-alone scroll triggers and ticker callbacks;
- a cleanup function `fn` returns.

`ctx.revert()` undoes it all, newest first. Each element the context animated
gets its original inline style (and SVG `d`) back, and the stage forgets the
values it applied, so the next setup starts clean. Selectors inside resolve
within `scope`. That suits a component or a route: create the context on mount
and revert it on unmount.

```js
const ctx = live.context(() => {
  live.from('.card', { y: 40, opacity: 0, stagger: 0.1 })
  button.addEventListener('click', () => ctx.add(() => live.to('.card', { rotate: 5 })))
}, section)

ctx.revert()
```

Work created later, for example in an event handler, joins the context only when
it runs inside `ctx.add(fn)`.

**`live.matchMedia()`** runs setups while media queries match:

```js
const mm = live.matchMedia()
mm.add({ desktop: '(min-width: 800px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
  const { desktop, reduce } = ctx.conditions
  if (reduce) return live.set('.hero-title', { opacity: 1 })   // a real reduced-motion mode
  live.timeline({ scrollTrigger: { pin: desktop, … } })
  return () => { /* anything else to undo */ }
})
```

- Each setup runs in its own context while any of its queries match.
- It is reverted when they stop matching, and run again whenever the set of
  matching conditions changes; `ctx.conditions` says which match.
- `mm.revert()` removes every setup and stops listening.

The [Agency Landing Page showcase](../src/examples/showcases/agency-landing.js)
wraps its whole page this way. Under reduced motion there is no pinning, parallax
or marquee, and values appear at their final state.

## Split text

`live.splitText` wraps text in spans so characters, words or lines can be
animated one after another (GSAP's SplitText):

```js
const split = live.splitText('.headline', { type: 'lines', mask: 'lines' })
live.fromTo(split.lines, { y: 40 }, { y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12 })

const title = live.splitText('.title', { type: 'words,chars' })
live.from(title.chars, { opacity: 0, y: 30, rotateX: -90, stagger: 0.03 })

split.revert()   // the original markup
```

| Option | Default | |
|---|---|---|
| `type` | `'chars,words,lines'` | Which pieces to create, comma-separated |
| `mask` | — | `'lines'`, `'words'` or `'chars'`: wrap each in an `overflow: clip` span, for reveals from behind an edge |
| `charsClass`, `wordsClass`, `linesClass` | `char`, `word`, `line` | Class names (masks get `<class>-mask`) |
| `aria` | `true` | Put the text in the element's `aria-label` and hide the pieces from screen readers |
| `autoSplit` | `false` | Split again when an element's width changes or fonts load |
| `onSplit(self)` | — | Called after every split; return the animation built on the pieces |

It returns `{ elements, chars, words, lines, masks, revert() }`.

What it does to the markup:

- **Words** become inline-block spans, so they can move and never break in the
  middle. Spaces stay as real text between them, so the text still wraps,
  selects and copies normally. Words are wrapped even when you only ask for
  `chars` or `lines` (they just aren't returned or classed).
- **Characters** are grapheme clusters, so an emoji or an accented letter stays in one piece.
- **Lines** are measured once, from where the browser wrapped the words. Inline
  markup such as `<em>` or `<a>` is kept and cloned into each line it spans;
  `<br>` ends a line. Lines depend on the element's width: with `autoSplit: true`
  the text is split again when an element's width changes or web fonts finish
  loading. Build the animation in `onSplit(self)` and return it, so it is killed
  before the pieces it animated are replaced. `split.split()` re-splits by hand.
- `revert()` restores the saved HTML. Event listeners attached to elements
  *inside* the split element are lost; attach them to the element itself.

## Flip

Animate elements from where they were to where a layout change put them:

```ts
live.flip('.item', () => grid.classList.toggle('compact'), { duration: 0.6, ease: 'power2.inOut', stagger: 0.03 })

// Or in two steps, when the change happens elsewhere:
const state = live.getFlipState('.item')
renderNewOrder()
live.flipFrom(state, { duration: 0.5, targets: '.item' })
```

| Option | Meaning |
|---|---|
| `duration`, `ease` | As for any tween (default 0.6s, `power2.inOut`) |
| `stagger` | Seconds between elements, in document order |
| `scale` | Animate size changes with scaleX/scaleY (default `true`); `false` moves only |
| `targets` | Elements that may have appeared in the change (`live.flip` passes its own) |
| `enter` | Start values for newly visible elements (default `{ opacity: 0, scale: 0.6 }`), or `false` |
| `fade` | Cross-fade shared elements (below): the incoming one fades in, the one it replaces fades out if still shown |
| `onComplete` | Called when it finishes |

Any change works: reorder the DOM, toggle classes, hide and show, resize.

**How it measures.** Before the change, where each element *appears*, including
the transform it may be animating with. After, where it is *laid out*, ignoring
transforms. Offsets are between centres, since scale happens about the centre.
Each element then gets an ordinary `fromTo` back to rest, so the result is plain
track data.

**Interrupting is smooth.** Starting a flip while another is running takes over
each element from where it appears right now.

**Shared elements.** Give two different elements the same `data-flip-id` and
they are treated as one thing: an element that was not recorded, but whose flip
id was, flips from where the recorded element was. That is how a gallery
thumbnail grows into a detail view's hero image, which is a separate element:

```js
thumb.addEventListener('click', () => {
  const state = live.getFlipState(thumb)            // record only what is leaving
  hero.dataset.flipId = thumb.dataset.flipId        // same id → same "thing"
  detail.hidden = false
  live.flipFrom(state, { targets: hero, fade: true, duration: 0.6 })
})

close.addEventListener('click', () => {
  const state = live.getFlipState(hero)
  detail.hidden = true
  live.flipFrom(state, { targets: thumb, fade: true })
})
```

Record only the element that is leaving: if both elements are in the state, each
is matched to itself. Matching works within one document (a client-side route
change counts; a full page load does not).

**Limits.** Size changes scale the element, so its content scales too during
the animation (text looks stretched mid-flip). Elements that disappear are not
animated out, because they are no longer rendered to see. There is no `absolute`
or `nested` mode yet.

## Inertia and dragging

A throw that slows under friction and comes to rest — GSAP's InertiaPlugin:

```ts
live.to('.puck', { inertia: { x: { velocity: 900, max: 400, end: 50 }, y: -300 } })
```

| Per-property option | Meaning |
|---|---|
| `velocity` | Speed at release, units per second (a bare number means just this) |
| `min`, `max` | Keep the resting place in bounds |
| `end` | Snap: a grid increment, a list of values, or a function `(naturalEnd) => number` |
| `friction` / `resistance` | How quickly it slows (friction 4 = resistance 100, the default) |

A throw decides its own duration, so `duration` is ignored for it, and the next
tween on the timeline starts after it — from where it came to rest. An `end`
function runs once, when the tween is built; the track stores the number.

**Dragging.** `live.draggable()` drags an element and throws it on release:

```ts
const slots = [{ x: 0, y: 0 }, { x: 180, y: 0 }, { x: 0, y: 90 }]
live.draggable('.card', { bounds: '.table', inertia: { end: slots, friction: 5 } })
live.draggable('.strip', { type: 'x', bounds: { minX: -480, maxX: 0 }, inertia: { end: { x: 120 } } })
```

| Option | Meaning |
|---|---|
| `type` | `'x'`, `'y'` or `'x,y'` (default) |
| `bounds` | An element (selector or element) to stay inside, or `{ minX, maxX, minY, maxY }` offsets |
| `snap` | Grid size while dragging |
| `inertia` | `true`, or `{ friction, resistance, end }` — `end` as a grid size, per-axis `{ x, y }`, or `{x, y}` points (nearest in 2D wins) |
| `onPress`, `onDrag`, `onRelease(velocity)`, `onThrowComplete` | Callbacks |

Dragging writes positions straight to the stage; the throw is an ordinary
inertia tween. Picking the element up mid-throw stops it where it is. Give
draggable elements `touch-action: none` so touch drags are not taken by page
scrolling.

**How it works.** Friction is exponential decay, which has an exact closed form,
so the value at any time is computed directly — no simulation, identical when
scrubbed backwards. Snapping aims the throw at the snap point while keeping its
rate of deceleration, so it lands exactly there without looking steered.

## Springs

`spring` on a tween animates its numeric properties with spring physics instead
of a duration and an ease:

```js
live.to('.card', { x: 0, scale: 1, spring: 'bouncy' })
live.to('.card', { y: 0, spring: { stiffness: 260, damping: 14, mass: 1 } })

// Release a drag into a spring, keeping the fling.
live.draggable('.card', {
  onRelease: (velocity) => live.to('.card', { x: 0, y: 0, spring: { preset: 'wobbly', velocity } }),
})
```

| Value | |
|---|---|
| `true` | The default spring (stiffness 180, damping 12, mass 1) |
| `'gentle'`, `'default'`, `'snappy'`, `'bouncy'`, `'wobbly'`, `'stiff'` | The presets the editor's spring inspector offers (`SPRING_PRESETS`) |
| `{ preset?, stiffness?, damping?, mass?, velocity?, restDelta? }` | Parameters, optionally over a preset. `velocity` is units per second — one number, or per property (`{ x: 800, y: -200 }`) |

- Each numeric property compiles to a **spring track**, so the result is still
  deterministic, scrubbable and plain JSON. Properties that are not numbers (a
  colour) keep tweening with `duration` and `ease`.
- A spring settles in its own time: `duration` and `ease` are ignored for the
  sprung properties, and the tween lasts as long as its slowest spring.
- **Interruptions keep their momentum.** Without a `velocity`, `live` starts the
  spring at the speed the property is already moving — measured once from the
  animation it takes over — so re-targeting mid-motion does not stall.
- All the sprung properties run on the shared frame loop, and each element is
  written once per frame however many there are.

The same spring as a track, without the GSAP-style API:

```ts
import { Timeline } from 'tinyfly'

const timeline = new Timeline({ id: 'springy' })
timeline.addTrack({
  id: 'pop',
  target: 'box',
  property: 'scale',
  kind: 'spring',
  spring: { from: 0, to: 1, stiffness: 200, damping: 12 },
})
```

Spring tracks are integrated at a fixed timestep from t=0, so scrubbing
backwards gives the same values as playing forwards and two runs are identical.
The animation is the *parameters*, so it serializes like anything else.

## Compile-time values

`"+=100"` and `"random(-50, 50)"` are resolved when the timeline is built, and
the concrete number is what lands in the JSON:

```ts
import { ValueResolver } from 'tinyfly'

const resolver = new ValueResolver(2024) // the seed
resolver.resolveSequence([0, '+=100', 'random(-50, 50)'])
// → [0, 100, -12.34]   — same seed, same numbers, every time

resolver.seed // store this alongside the timeline to reproduce it
```

## Full example

```ts
import { timeline, quickPlay } from 'tinyfly/gsap-compat'

const tl = timeline({
  repeat: -1,
  yoyo: true,
  repeatDelay: 0.5,
  onWarning: console.warn,
})

tl.fromTo('title', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
tl.addLabel('lettersIn')
tl.fromTo(
  ['l1', 'l2', 'l3', 'l4'],
  { opacity: 0, y: 20 },
  { opacity: 1, y: 0, duration: 0.5, stagger: { each: 0.08, from: 'center' } },
  'lettersIn'
)
tl.to('title', { scale: 1.05, duration: 0.3 }, '>')

// Inspect what it compiled to — it is ordinary tinyfly JSON.
console.log(JSON.stringify(tl.toDefinition(), null, 2))

quickPlay({
  timeline: tl.timeline,
  targets: { title: '#title', l1: '#l1', l2: '#l2', l3: '#l3', l4: '#l4' },
})
```
