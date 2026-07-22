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
| **Timeline Definition** | `{ id, name?, config, tracks[] }` | The engine's serialized timeline (`exportJSON()` / the `.json` files the toolbar exports & imports). What a custom player consumes. |
| **Project** | `{ id, name, canvas, scenes[], ... }` | The editor's saved document — one or more scenes, each with its own elements + timeline. |
| **Sequence** | `{ id, name, canvas, scenes[] }` | A multi-scene bundle for the embeddable player/sequencer. |

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
| `path` | `d` (SVG path data), `fill`, `stroke`, `strokeWidth`, `lineCap`, `lineJoin` (`miter`\|`round`\|`bevel`), `closed` (bool) |
| `group` | `childIds` (string[]) — ids of grouped elements |

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
  - `value` — a number, a color string, or a number array, depending on the
    property (an [AnimatableValue](#value-types)).
  - `easing` — optional; the curve used interpolating **into** this keyframe.
    Defaults to `linear`.

### Value types

`value` is one of:

- **number** — e.g. `x`, `opacity`, `scale`, `rotate`, `width`.
- **color string** — e.g. `fill`, `stroke` (`"#ff0000"`, `"rgb(...)"`).
  Interpolated channel-by-channel.
- **number[]** — for array-valued properties.

### Animatable properties

| Category | Properties |
|----------|-----------|
| Position | `x`, `y`, `z` |
| Transform | `rotate`, `rotateX`, `rotateY`, `rotateZ`, `scale`, `scaleX`, `scaleY`, `scaleZ`, `skewX`, `skewY` |
| Appearance | `opacity`, `fill`, `stroke`, `strokeWidth`, `width`, `height`, `borderRadius`, `fontSize` |
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
    "rotateOffset": 0                            // degrees added when autoRotate
  },
  "keyframes": [
    { "time": 0,    "value": 0 },   // progress 0..1 along the path
    { "time": 2000, "value": 1, "easing": "ease-in-out" }
  ]
}
```

Keyframe `value`s are **progress** along the path (`0`–`1`).

---

## 2. Timeline Definition

The engine's serialized timeline — what `Timeline.exportJSON()` produces, what
`deserializeTimeline()` / the standalone player consume, and the shape of the
`.json` files the editor's **Export/Import** buttons write and read.

```jsonc
{
  "id": "scene-1",
  "name": "My Animation",          // optional
  "config": {
    "duration": 2000,              // ms; omit to auto-derive from tracks
    "loop": 0,                     // 0 = play once, -1 = infinite, N = N loops
    "speed": 1,                    // playback multiplier
    "alternate": false             // ping-pong direction each loop
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

### Consuming a Timeline (custom integration)

```ts
import { deserializeTimeline } from 'tinyfly'
import { DOMAdapter } from 'tinyfly/adapters/dom'

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
  ]
}
```

- `canvas.background` is a CSS color; also the default background for raster
  exports.
- `scene.timeline` is a full [Timeline Definition](#2-timeline-definition) (or
  `null` for an empty scene). Here the timeline `target`s are element **ids**.
- `scene.transition.type` is one of `none`, `fade`, `slide-left`,
  `slide-right`, `slide-up`, `slide-down`.

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
  ]
}
```

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
