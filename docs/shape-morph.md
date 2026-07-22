# Shape morphing (shape tween)

Animate one path into another — a hexagon into a star, a blob into a circle — by
tweening the path's `d` over the timeline.

## Using it

1. Select a path (a ⬡ Polygon / ★ Star, or any path).
2. In **Properties → 🌀 Shape Morph**, pick the **target** shape (Polygon or Star)
   and its points / inner %.
3. Click **Create shape morph →**. A `d` track is added that tweens from the
   current shape to the target across the timeline.
4. Press **Play** to watch it morph. The `d` track appears in the timeline like
   any other; edit or delete it there.

## How it works

The engine interpolates path `d` strings natively. `getInterpolator` detects path
data (a string starting with a moveto) and routes it to a **path morph**:

```ts
// src/engine/path/path-morph.ts
morphPath(fromD, toD, progress, samples = 64)
```

Both paths are sampled uniformly along their length with
`getPointAtProgress`, and the sampled points are blended by `progress` — so any
two shapes morph smoothly and **deterministically**, with no DOM required (it
runs in the engine, workers, and tests).

## Where it renders

Because morphing is engine-level, it works everywhere a `d` value can be applied:

- **DOM preview** — the path binds its `d` to the animated value.
- **SVG preview** — the SVG adapter sets the `d` attribute.
- **Canvas preview & raster export** — the Canvas adapter rebuilds a `Path2D`
  from the animated `d` each frame.
- **Embeds / player** — the DOM adapter drives the child `<path>`'s `d`.

## Limitations / later

- The morph is sampled to a 64-point polyline, so very sharp corners soften
  slightly mid-tween (endpoints stay faithful).
- Fill/stroke morph independently via their own tracks; only geometry is tweened
  by the `d` track.
- Authoring targets are polygon/star today; morphing to an arbitrary hand-drawn
  path is a later addition.
