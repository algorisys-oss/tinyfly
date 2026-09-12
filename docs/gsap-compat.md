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
| Draggable / Observer / Inertia | `tinyfly/interaction` — `Draggable`, `Observer` |
| Flip | `flip()` in the DOM adapter — measures at author time, emits keyframes |
| MorphSVG | Shape morphing — see [shape-morph.md](./shape-morph.md) |
| MotionPathPlugin | Motion path tracks, built in |
| DrawSVG | Stroke write-on, built in |
| SplitText | Text splitting in the editor, built in |
| Physics2D / Inertia | [Spring tracks](#springs) — deterministic and serializable |

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
