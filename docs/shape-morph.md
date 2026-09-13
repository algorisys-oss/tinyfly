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
morphPath(fromD, toD, progress, { shapeIndex? })
```

Both paths are resampled into matching point lists, which are blended by
`progress`. The matching is worked out once per pair of shapes and cached:

- **Subpaths are paired** when both paths have the same number, so holes morph
  into holes.
- **The start point and winding are chosen** so points travel least (about each
  shape's centre) — nothing twists or turns inside out. Pass `shapeIndex` to
  force a particular alignment.
- **Corners are kept**: samples are spaced by length and always include every
  corner of both shapes.
- Open paths stay open; at progress 0 and 1 the original strings come back
  exactly.

It is deterministic and needs no DOM (it runs in the engine, workers, and tests).
From code, use `morphSVG` in `live` or `tf` — see
[gsap-compat.md](gsap-compat.md#shape-morphing).

## Where it renders

Because morphing is engine-level, it works everywhere a `d` value can be applied:

- **DOM preview** — the path binds its `d` to the animated value.
- **SVG preview** — the SVG adapter sets the `d` attribute.
- **Canvas preview & raster export** — the Canvas adapter rebuilds a `Path2D`
  from the animated `d` each frame.
- **Embeds / player** — the DOM adapter drives the child `<path>`'s `d`.

## Limitations / later

- Mid-morph shapes are drawn as dense polylines (about one point per 2.5px of
  length, plus every corner), so curves are faithful at normal sizes; very large
  curved shapes can show faint facets mid-tween.
- Fill/stroke morph independently via their own tracks; only geometry is tweened
  by the `d` track.
- In the editor, authoring targets are polygon/star today. From code, `morphSVG`
  morphs between any paths or basic shapes.
