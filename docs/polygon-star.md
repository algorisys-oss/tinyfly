# Polygon & star shapes

Add regular polygons and stars from the **Elements** panel. They are ordinary
closed paths under the hood, so they render, animate, and export exactly like any
other path — while staying parametric (editable sides/points, resizable).

## Using them

- In the **Elements** panel, click **⬡ Polygon** or **★ Star**.
- Select the shape and open **Properties**:
  - **Sides** (polygon) or **Points** (star)
  - **Inner %** (star) — the inner radius as a percentage of the outer radius
- **Resize** the shape on the stage like any box; the geometry regenerates to fill
  the new width/height, so sides/points stay crisp at any size.

## How it works

`src/editor/utils/poly-star.ts` is a pure, unit-tested geometry helper:

```ts
polygonVertices(width, height, sides)          // inscribed in the box, first vertex up
starVertices(width, height, points, innerRatio)
verticesToPath(verts)                          // → "M … L … Z"
polyStarPath(spec, width, height)              // → path `d`
```

A polygon/star is a `PathElement` with an extra `shape: { kind, points, innerRatio }`
spec. The scene store keeps the path `d` in sync:

- `addPolyStar(spec, overrides)` creates it (solid fill, closed).
- `updateShape(id, patch)` changes sides/points/inner ratio and regenerates `d`.
- `updateElement` regenerates `d` whenever the width/height (or spec) changes, so
  resizing rescales the shape.

Because it's a plain path with a generated `d`, every renderer (DOM/Canvas/SVG),
raster export, and embed handles it with no special cases. In the editor, a
parametric shape shows the box + resize handles (not per-vertex control points) so
it resizes as a unit.

## Limitations / later

- Corner rounding and per-vertex editing aren't offered for parametric shapes
  (convert intent is a plain path if you need free vertices).
- Grid size / rotation snapping apply as they do for any element.
