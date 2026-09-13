# tinyfly File Format

tinyfly animations are **plain JSON** — no binary blobs, no framework-specific
wrappers. This document is the reference for anyone generating, consuming, or
integrating tinyfly animations (tooling, AI generation, importers/exporters,
custom players).

Everything here is stable, serializable data. The same JSON plays in the
browser, a Web Worker, or any headless JS runtime, and always produces the same
output for the same input (see [Determinism](#determinism)).

---

## The formats at a glance

tinyfly has a few related JSON shapes. Pick the one that matches your task:

| Format | Shape | Use it for |
|--------|-------|------------|
| **Animation Document** | `{ duration, canvas?, elements[], tracks[] }` | **The integration format.** Author or generate animations by hand/AI. Loaded the same way samples are. |
| **Timeline Definition** | `{ id, name?, config, tracks[] }` | The engine's serialized timeline (`serializeTimeline()` / `toJSON()`, and the `.json` files the editor exports & imports). What a custom player consumes. |
| **Project** | `{ id, name, canvas, scenes[], symbols[], ... }` | The editor's saved document — one or more scenes, each with its own elements + timeline, plus a symbol library. |
| **Sequence** | `{ id, name, canvas, scenes[], symbols? }` | A multi-scene bundle for the embeddable player/sequencer. |

If you're integrating with tinyfly, start with the **Animation Document** — it's
the highest-level, most stable shape and describes *what to draw* as well as
*how to animate it*.

---

## 1. Animation Document

The document a sample, an AI generation, or a hand-authored animation uses. It
describes a set of **elements** (the things on the artboard) and **tracks** (how
their properties change over time).

```jsonc
{
  "duration": 2000,                       // total length in ms (required, > 0)
  "canvas": { "width": 300, "height": 200 }, // optional artboard size
  "elements": [ /* Element[] */ ],        // what to draw
  "tracks":   [ /* Track[]   */ ]         // how to animate it
}
```

- `duration` — **required**, milliseconds, must be `> 0`. The timeline can
  auto-extend to fit tracks, but always declare the intended length.
- `canvas` — optional `{ width, height }` in px. When present, loading the
  document resizes the artboard (e.g. a vertical `360×640` promo). Defaults to
  the current/host canvas.
- `elements` — array of [Elements](#elements).
- `tracks` — array of [Tracks](#tracks-and-keyframes). A track's `target` matches
  an **element `name`** (see below).

> **Key rule:** in the Animation Document, tracks bind to elements by **`name`**,
> not `id`. Element `id`s are assigned by the editor on load; names are what you
> author against. Every `track.target` must equal some `element.name`.

### Minimal example

```json
{
  "duration": 2000,
  "canvas": { "width": 300, "height": 200 },
  "elements": [
    { "type": "rect", "name": "Box", "x": 120, "y": 70, "width": 60, "height": 60, "fill": "#4a9eff", "borderRadius": 8 }
  ],
  "tracks": [
    {
      "target": "Box",
      "property": "opacity",
      "keyframes": [
        { "time": 0,    "value": 0 },
        { "time": 500,  "value": 1, "easing": "ease-out" },
        { "time": 1500, "value": 1 },
        { "time": 2000, "value": 0, "easing": "ease-in" }
      ]
    }
  ]
}
```

---

## Elements

Every element shares a **base** shape and adds a few fields per `type`. When
authoring a document, most base fields are optional and are filled with sensible
defaults — but `type` and `name` should always be set (`name` is how tracks find
it). Coordinates are in artboard pixels; the origin is the top-left.

### Base fields (all element types)

| Field | Type | Notes |
|-------|------|-------|
| `type` | string | One of the element types below. **Required.** |
| `name` | string | Human-readable id used as a track `target`. **Required for animation.** |
| `x`, `y` | number | Top-left position in px. |
| `width`, `height` | number | Size in px. |
| `rotation` | number | Degrees. |
| `opacity` | number | `0`–`1`. |
| `visible` | boolean | Hidden elements are skipped in render/export. |
| `locked` | boolean | Editor-only (not selectable); no runtime effect. |
| `id` | string | Assigned by the editor. Omit when authoring. |

### Element types & their extra fields

| `type` | Extra fields |
|--------|--------------|
| `rect` | `fill` (color or [gradient](#fills--gradients)), `stroke`, `strokeWidth`, `borderRadius` |
| `circle` | `fill`, `stroke`, `strokeWidth` |
| `text` | `text` (string), `fontSize`, `fontFamily`, `fontWeight`, `fill`, `textAlign` (`left`\|`center`\|`right`) |
| `image` | `src` (URL or data URI), `objectFit` (`contain`\|`cover`\|`fill`) |
| `video` | `src`, `objectFit`, `borderRadius`, `volume` (0–1), `muted`, `loop`, `startTime` (ms) |
| `audio` | `src`, `volume` (0–1), `muted`, `loop`, `startTime` (ms) |
| `line` | `x2`, `y2`, `stroke`, `strokeWidth`, `lineCap` (`butt`\|`round`\|`square`) |
| `arrow` | `x2`, `y2`, `stroke`, `strokeWidth`, `headSize`, `startHead` (bool), `endHead` (bool) |
| `path` | `d` (SVG path data), `fill`, `stroke`, `strokeWidth`, `lineCap`, `lineJoin` (`miter`\|`round`\|`bevel`), `closed` (bool), `shape` (optional `{ kind: 'polygon'\|'star', points, innerRatio? }` — a parametric polygon/star whose `d` is regenerated from the spec and the element's size; see [polygon-star.md](polygon-star.md)) |
| `group` | `childIds` (string[]) — ids of grouped elements |
| `symbol` | `symbolId` (id of a symbol in the Project's `symbols` library), `swapSet` (optional string[] of symbol ids; a `swapIndex` track picks `swapSet[floor(swapIndex)]`), `overrides` (reserved). Only meaningful inside a [Project](#3-project-format), which carries the library — see [symbols-and-library.md](symbols-and-library.md) |

### Fills & gradients

`fill` (on `rect`, `circle`, `path`) is either a CSS color string
(`"#4a9eff"`, `"rgba(...)"`) **or** a gradient object:

```jsonc
// Linear gradient — angle in degrees (0 = left→right, 90 = top→bottom)
{
  "type": "linear",
  "angle": 90,
  "stops": [ { "offset": 0, "color": "#4a9eff" }, { "offset": 1, "color": "#9b59b6" } ]
}

// Radial gradient — center/radius are 0–1, relative to the element box
{
  "type": "radial",
  "centerX": 0.5,
  "centerY": 0.5,
  "radius": 0.5,
  "stops": [ { "offset": 0, "color": "#fff" }, { "offset": 1, "color": "#000" } ]
}
```

`stops[].offset` is `0`–`1`; `angle` is in degrees; `centerX`/`centerY`/`radius`
are fractions of the element box (`0`–`1`).

---

## Tracks and keyframes

A **track** animates one property of one target over time.

```jsonc
{
  "id": "opacity-1",        // optional in a document; the editor assigns one
  "target": "Box",          // MUST match an element `name`
  "property": "opacity",    // see the animatable-properties table
  "keyframes": [
    { "time": 0,   "value": 0 },
    { "time": 500, "value": 1, "easing": "ease-out" }
  ]
}
```

- `target` — the element `name` to animate (in the engine Timeline format this
  is the element **id** instead — see [Timeline Definition](#2-timeline-definition)).
- `property` — the property to animate (below).
- `keyframes` — **sorted by `time`** (ascending), each:
  - `time` — milliseconds from the timeline start.
  - `value` — a number, a string (colour or path data), or a number array,
    depending on the property (an [AnimatableValue](#value-types)).
  - `easing` — optional; the curve used interpolating **into** this keyframe.
    Defaults to `linear`.

### Value types

`value` is one of:

- **number** — e.g. `x`, `opacity`, `scale`, `rotate`, `width`.
- **color string** — e.g. `fill`, `stroke` (`"#ff0000"`, `"rgb(...)"`).
  Interpolated channel-by-channel.
- **path string** — SVG path data starting with a moveto (`"M0 0 L10 10"`),
  e.g. on a `d` track. Morphed point-by-point between keyframes, so any two
  shapes blend — see [shape-morph.md](shape-morph.md).
- **other strings** — not interpolated: the value jumps to the next keyframe's
  string when that keyframe is reached. To animate text, use a
  [text track](#text-tracks).
- **number[]** — for array-valued properties.

Between two keyframes, the earlier keyframe's value decides the interpolator: a
number, an array, a string starting with `#` or `rgb` (colour), a path string,
or any other string (discrete).

### Animatable properties

| Category | Properties |
|----------|-----------|
| Position | `x`, `y`, `z` |
| Transform | `rotate`, `rotateX`, `rotateY`, `rotateZ`, `scale`, `scaleX`, `scaleY`, `scaleZ`, `skewX`, `skewY` |
| Appearance | `opacity`, `fill`, `stroke`, `strokeWidth`, `width`, `height`, `borderRadius`, `fontSize` |
| Shape | `d` (path string — morphs the path's shape) |
| Text | `text` (via a [text track](#text-tracks)) |
| Clip / reveal | `clipTop`, `clipRight`, `clipBottom`, `clipLeft` (inset %, `0` = fully shown, `100` = fully clipped from that edge) |
| Filters | `blur`, `glow`, `dropShadow` |
| Stroke draw-on | `strokeDasharray`, `strokeDashoffset` |
| Shine | `shine` (0–1 sweep position) |
| Motion path | `motionPathX`, `motionPathY`, `motionPathRotate` (usually via a motion-path track — below) |

Adapters ignore properties that don't apply to a given render target, so an
unknown/unsupported property is a no-op, never an error.

### Easing values

`easing` is either a **built-in name**:

```
linear
ease-in            ease-out            ease-in-out
ease-in-quad       ease-out-quad       ease-in-out-quad
ease-in-cubic      ease-out-cubic      ease-in-out-cubic
```

…or a **custom cubic-bezier**:

```json
{ "type": "cubic-bezier", "points": [0.68, -0.55, 0.27, 1.55] }
```

`points` are `[cp1x, cp1y, cp2x, cp2y]` (CSS `cubic-bezier` order).

### Motion-path tracks

A track can animate an element **along an SVG path** instead of listing X/Y
keyframes. Its `property` is the literal `"motionPath"` and it carries a
`motionPathConfig`:

```jsonc
{
  "target": "Ball",
  "property": "motionPath",
  "motionPathConfig": {
    "pathData": "M0,0 C50,-80 150,-80 200,0",  // SVG `d`
    "autoRotate": true,                          // face the path tangent
    "rotateOffset": 0,                           // degrees added when autoRotate
    "matrix": [1, 0, 0, 1, 40, 20]               // optional affine transform
  },
  "keyframes": [
    { "time": 0,    "value": 0 },   // progress 0..1 along the path
    { "time": 2000, "value": 1, "easing": "ease-in-out" }
  ]
}
```

Keyframe `value`s are **progress** along the path (`0`–`1`), measured by arc
length. The timeline expands progress into `motionPathX`, `motionPathY` and
(with `autoRotate`) `motionPathRotate`.

`matrix` is an optional affine transform `[a, b, c, d, e, f]` applied to every
point on the path and to its tangent: `x' = a·x + c·y + e`, `y' = b·x + d·y + f`.
It places a path drawn in one coordinate space (an SVG's user units) into the
follower's space. Omit it for identity. `live`'s `motionPath` `align` option
writes it — see [gsap-compat.md](gsap-compat.md#motion-paths).

### Text tracks

A track whose `property` is the literal `"text"` types or scrambles from one
string to another. Like a motion path, its keyframes carry **progress**
(`0`–`1`) with easing, and `textConfig` says what the progress means:

```jsonc
{
  "id": "title-text",
  "target": "Title",
  "property": "text",
  "textConfig": {
    "from": "LOADING",          // text at progress 0 (default "")
    "to": "TINYFLY",            // text at progress 1 (required)
    "mode": "scramble",         // "type" | "scramble" (required)
    "chars": "upperCase",       // scramble: upperCase | lowerCase | upperAndLowerCase | numbers | your own characters
    "revealDelay": 0.3,         // scramble: fraction of the tween before characters settle
    "seed": 7                   // scramble: fixes the random characters
  },
  "keyframes": [
    { "time": 0,    "value": 0 },
    { "time": 1200, "value": 1, "easing": "ease-out" }
  ]
}
```

Other `textConfig` fields: `refreshRate` (scramble: random-character changes
per second, default `20`), `tweenLength` (scramble: grow or shrink the length
over the tween, default `true`), `rightToLeft` (reveal from the end). The
timeline turns progress into a `text` value; adapters set it as the element's
text. Scramble characters come from a hash of the seed, position and refresh
step, so the string at any time is always the same.

### Spring tracks

A track with `"kind": "spring"` has no keyframes. Its values come from a
spring simulation, integrated at a fixed step from `t = 0`, so it is still a pure
function of time. The track stores the parameters, not a baked curve:

```jsonc
{
  "id": "pop",
  "target": "Box",
  "property": "scale",
  "kind": "spring",
  "spring": {
    "from": 0,          // required
    "to": 1,            // required: resting value
    "stiffness": 180,   // default 180 — higher is snappier
    "damping": 12,      // default 12 — higher settles sooner, 0 oscillates forever
    "mass": 1,          // default 1
    "velocity": 0,      // default 0, units per second
    "restDelta": 0.01,  // default 0.01, fraction of the travel distance
    "restSpeed": 0.1    // default 0.1, fraction of the travel distance per second
  },
  "delay": 200
}
```

A spring decides its own duration: the time until it settles, plus `delay`.

### Inertia tracks

A track with `"kind": "inertia"` is a throw: a value released with a velocity
that slows under friction and comes to rest. It has no keyframes; the motion is
a closed-form function of time.

```jsonc
{
  "id": "puck-x",
  "target": "Puck",
  "property": "x",
  "kind": "inertia",
  "inertia": {
    "from": 0,          // required: value at release
    "velocity": 900,    // required: units per second (negative moves down)
    "friction": 4,      // default 4 — exponential decay rate per second
    "min": 0,           // optional lowest resting value
    "max": 240,         // optional highest resting value
    "end": 120          // optional: a number snaps to multiples of it; an array snaps to the nearest listed value
  },
  "delay": 200
}
```

`restDelta` (optional) sets how close to the resting value counts as settled;
by default it scales with the distance travelled. Like a spring, an inertia
track decides its own duration.

### Track scheduling

Every track kind accepts these optional fields. They are omitted from the JSON
when unset.

| Field | Type | Meaning |
|-------|------|---------|
| `delay` | number (ms) | Shift the whole track later. `"delay": 200` is the same as adding 200 to every keyframe's `time`. |
| `endDelay` | number (ms) | Extra time held after the last keyframe. Extends the track's (and so the timeline's) duration without changing its final value. Keyframe and text tracks only. |
| `targets` | string[] | Drive several targets from this one track. When present, `target` is ignored. |
| `stagger` | `{ each?, amount?, from? }` | Offsets each of `targets` in time. Ignored without `targets`. |

`stagger` fields:

- `each` — ms between consecutive targets.
- `amount` — total spread in ms, divided across the targets. Wins over `each`.
- `from` — which target starts first: `"start"` (default), `"end"`,
  `"center"`, `"edges"`, or a target index.

With neither `each` nor `amount`, every offset is `0`.

```jsonc
{
  "id": "letters-in",
  "target": "l1",
  "targets": ["l1", "l2", "l3", "l4"],
  "stagger": { "each": 80, "from": "center" },
  "property": "opacity",
  "keyframes": [
    { "time": 0,   "value": 0 },
    { "time": 400, "value": 1, "easing": "ease-out" }
  ],
  "delay": 100
}
```

When several tracks drive the same target and property, the value comes from
the one that started most recently (its first keyframe plus delay and stagger).
Ties go to the track listed later.

### Track kinds in an Animation Document

The editor loads an Animation Document's tracks through its own authoring
actions, so it reads only part of each track kind:

| Track | What the loader keeps |
|-------|-----------------------|
| Keyframe | `target`, `property`, `keyframes`. Scheduling fields are dropped. |
| Motion path | `pathData`, `autoRotate`, `rotateOffset`. Start and end time come from the first and last keyframes, easing from the last. `matrix` and middle keyframes are dropped. |
| Text | `textConfig`. Start and end time come from the first and last keyframes, easing from the last. |
| Inertia | `inertia` and `delay` |
| Spring | Not supported. Add springs in the editor, or use a [Timeline Definition](#2-timeline-definition). |

The engine itself reads every field above. Put springs, `matrix`, `targets` and
`stagger` in a Timeline Definition.

---

## 2. Timeline Definition

The engine's serialized timeline — what `serializeTimeline(timeline)` (or
`toJSON(timeline)` for a string) produces, what `deserializeTimeline()` /
`fromJSON()` / the standalone player consume, and the shape of the `.json` files
the editor's JSON export and import write and read.

```ts
import { serializeTimeline, toJSON, fromJSON } from 'tinyfly'

const definition = serializeTimeline(timeline)   // TimelineDefinition object
const json = toJSON(timeline)                    // the same, as a string
const restored = fromJSON(json)                  // back to a Timeline
```

`timeline.toDefinition()` returns the same shape without copying: its `config`
is exactly what the timeline was built with and its `tracks` are the live track
objects. Use `serializeTimeline` when you need a detached copy.

```jsonc
{
  "id": "scene-1",
  "name": "My Animation",          // optional
  "config": {
    "duration": 2000,              // ms; omit to auto-derive from tracks
    "loop": 0,                     // 0 = play once, -1 = infinite, N = repeat N more times
    "speed": 1,                    // playback multiplier
    "alternate": false,            // ping-pong direction each loop
    "repeatDelay": 500             // ms to wait between loop iterations
  },
  "tracks": [
    {
      "id": "track-1",
      "target": "box",             // element id (see note)
      "property": "opacity",
      "keyframes": [
        { "time": 0,    "value": 0 },
        { "time": 1000, "value": 1, "easing": "ease-out" }
      ]
    }
  ]
}
```

Differences from the Animation Document:

- It is **timeline-only** — no `elements`. The engine animates *targets*;
  something else (a DOM/Canvas/SVG adapter) owns the actual objects and maps
  `target` → real element.
- `target` here is whatever key you registered with the adapter — in editor
  exports that's the element **id**; in a hand-wired integration it's your own
  key (e.g. `adapter.registerTarget("box", el)`).
- Playback options live under `config`.
- `tracks` may mix every track kind: keyframe, [motion-path](#motion-path-tracks),
  [text](#text-tracks), [spring](#spring-tracks) and [inertia](#inertia-tracks),
  each with the [scheduling fields](#track-scheduling).

`repeatDelay` applies when the timeline loops (`loop` is not `0`). Going
forward, the playhead **holds the last frame** for the delay, then wraps to the
start. With `alternate`, it holds at whichever end it reached before turning
round. The delay is consumed at the timeline's `speed`, and a `seek()` cancels a
pending delay.

### Consuming a Timeline (custom integration)

```ts
import { deserializeTimeline } from 'tinyfly'
import { DOMAdapter } from 'tinyfly/adapters'

const timeline = deserializeTimeline(json)   // json = Timeline Definition
const adapter = new DOMAdapter()
adapter.registerTarget('box', document.querySelector('#box'))

function frame(dt) {
  timeline.tick(dt)                            // advance by dt ms
  adapter.applyState(timeline.getStateAtTime(timeline.currentTime))
  requestAnimationFrame(() => frame(16.67))
}
timeline.play()
frame(16.67)
```

Or skip the wiring entirely with the bundled player (`TinyflyPlayer`) — see the
[API reference](api-reference.md) and [Getting Started](getting-started.md).

---

## 3. Project format

The editor's saved document (in IndexedDB, and what you'd export to move a whole
project). One project holds one or more **scenes**, each with its own elements
and timeline.

```jsonc
{
  "id": "project-…",
  "name": "Untitled Animation",
  "created": 1750000000000,        // epoch ms
  "modified": 1750000000000,
  "canvas": { "width": 300, "height": 200, "background": "#252525" },
  "activeSceneId": "scene-…",
  "scenes": [
    {
      "id": "scene-…",
      "name": "Scene 1",
      "order": 0,
      "elements": [ /* Element[] (with ids) */ ],
      "timeline": { /* Timeline Definition | null */ },
      "transition": { "type": "fade", "duration": 400 }   // optional
    }
  ],
  "symbols": [                     // the Library, shared across scenes
    {
      "id": "symbol-…",
      "name": "Mouth",
      "width": 120, "height": 80,  // intrinsic size; instances scale from it
      "elements": [ /* Element[] */ ],
      "timeline": { /* Timeline Definition | null */ },
      "created": 1750000000000,
      "modified": 1750000000000
    }
  ]
}
```

- `canvas.background` is a CSS color; also the default background for raster
  exports.
- `scene.timeline` is a full [Timeline Definition](#2-timeline-definition) (or
  `null` for an empty scene). Here the timeline `target`s are element **ids**.
- `scene.transition.type` is one of `none`, `fade`, `slide-left`,
  `slide-right`, `slide-up`, `slide-down`.
- `symbols` holds reusable symbol definitions. A `symbol` element points at one
  by `symbolId`; the symbol's own `timeline` plays inside each instance. Projects
  saved before symbols existed load with an empty list.

---

## 4. Sequence format

A flattened, self-contained bundle for the embeddable multi-scene player
(`TinyflySequencer`). Each scene carries pre-rendered element HTML so the player
needs no editor code.

```jsonc
{
  "id": "project-…",
  "name": "My Promo",
  "canvas": { "width": 360, "height": 640, "background": "#111" },
  "scenes": [
    {
      "id": "scene-…",
      "name": "Scene 1",
      "elements": [
        { "type": "rect", "name": "Box", "x": 0, "y": 0, "width": 60, "height": 60,
          "rotation": 0, "opacity": 1, "html": "<div …></div>" }
      ],
      "timeline": { /* Timeline Definition */ },
      "transition": { "type": "fade", "duration": 400 }
    }
  ],
  "loop": 0,                       // optional: -1 = infinite, 0 = no loop, N = N times
  "symbols": [                     // optional: nested timelines for symbol instances
    { "id": "symbol-…", "timeline": { /* Timeline Definition */ } }
  ]
}
```

`symbols` lists only symbols that are used in a scene and have a non-empty
timeline. The sequencer animates each instance's inner elements (tagged
`data-tinyfly-symbol`) from the matching timeline.

This is what the editor's **Embed → All Scenes** option emits. For a single
scene, embedding emits a plain [Timeline Definition](#2-timeline-definition)
plus its element HTML.

---

## Determinism

tinyfly guarantees **same input → same output**:

- All timing is explicit and in **milliseconds**. The engine advances by the
  `dt` you feed `tick(dt)`; it never reads wall-clock time itself.
- Interpolation and easing are pure functions of `(from, to, progress)`.
- No implicit browser or global state affects the produced values.

So a document rendered at 30fps, 60fps, or frame-stepped for export yields the
same values at the same timeline times — which is why GIF/WebP/MP4 export is
reproducible.

---

## Versioning & forward-compatibility

- Unknown **element fields** and unknown **animatable properties** are ignored by
  adapters, not rejected — older players tolerate newer documents' extras.
- Older documents are migrated on load (e.g. a pre-scenes project is wrapped into
  a single scene; a missing `canvas.background` picks up the default).
- There is no explicit format-version field today; the shapes above are additive.
  Treat missing optional fields as their documented defaults.

---

## See also

- [Getting Started](getting-started.md) — install and play your first animation.
- [API Reference](api-reference.md) — `Timeline`, adapters, `TinyflyPlayer`.
- [Editor Guide](editor-guide.md) — how these documents are produced in the UI.
- [Examples](examples.md) — complete, annotated animations.
