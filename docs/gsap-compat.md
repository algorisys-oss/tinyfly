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

> Twenty-nine runnable demos are on the Examples page under **GSAP-style**
> (`/examples?category=gsap`), each with its code and **Copy code**: motion
> paths and orbits, shape and menu morphs, scrambled and typed text, dashboard
> stats, draggable throws (slots, carousel, swipe cards), friction, stagger,
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
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.52.0/cdn/tinyfly.iife.js"></script>
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

**DOM reads happen once, when a tween is built — never per frame.** The start
value `live` adds comes from what tinyfly last applied. Beyond that, it reads the
page only where GSAP's option names something on the page: a shape's current
path (`morphSVG`), an element's current text (`text`, `scrambleText`), and a
path's geometry and the follower's layout (`motionPath` with `align`). Whatever
it reads is written into the compiled tracks as plain values, so the JSON still
describes the animation completely. It never reads `getComputedStyle`: an
element styled by CSS alone starts numeric and colour properties from the static
defaults, so use `fromTo` for the first tween on those.

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

Units: the facade speaks **seconds**, like GSAP. Everything it stores is in
**milliseconds**, like the engine. The conversion happens at the boundary and
nowhere else.

## Easing

Most GSAP eases map to an exact built-in or a close cubic-bezier:

| GSAP | Result |
|---|---|
| `none`, `linear` | `linear` |
| `power2.*`, `power3.*` | Exact built-in equivalents |
| `power1.*`, `power4.*`, `sine.*`, `expo.*`, `circ.*`, `back.*` | Cubic-bezier |
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
[todo.md](../todo.md), with designs that resolve values once at load rather than
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
| ScrollTrigger | [`tinyfly/drivers`](./scroll-animation.md) — `ScrollDriver`, `VisibilityDriver`, plus a scroll-scrub preview in the editor |
| Draggable / Observer | `live.draggable()`, and `tinyfly/interaction` — `Draggable`, `Observer` |
| InertiaPlugin | The `inertia` tween option and inertia tracks — see [Inertia](#inertia-and-dragging) |
| Flip | `flip()` in the DOM adapter — measures at author time, emits keyframes |
| MorphSVG | The `morphSVG` tween option — see [Shape morphing](#shape-morphing) |
| MotionPathPlugin | The `motionPath` tween option — see [Motion paths](#motion-paths) |
| DrawSVG | Stroke write-on, built in |
| SplitText | Text splitting in the editor, built in |
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

A spring is a better answer than an elastic ease when you want real physics:

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
