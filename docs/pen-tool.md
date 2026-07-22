# Pen tool

Draw custom paths point by point — straight segments and smooth bezier curves —
in the DOM preview.

## Using it

1. In the DOM preview header, click **✒️ Pen**.
2. **Click** on the stage to drop anchor points (straight segments between them).
3. **Click-drag** to pull out a curve handle as you place a point (a smooth
   bezier, with symmetric handles).
4. **Finish**:
   - **Click the first point** to close the path (filled). It grows and turns cyan
     when the cursor is close enough to close.
   - **Enter** or **double-click** to finish an open path (stroked).
   - **Backspace / Delete** removes the last point you placed.
   - **Esc** to cancel.

The result is a normal `PathElement`, so it animates, morphs, and exports like any
other path. Open paths default to a 2px stroke with no fill; closed paths get a
solid fill.

## How it works

The geometry is a pure, unit-tested helper:

```ts
// src/editor/utils/pen-path.ts
buildPenPath(nodes, closed)     // nodes → "M … L/C … [Z]"
penNodesBounds(nodes)           // bbox incl. handles
localizePenPath(nodes, closed)  // → { x, y, width, height, d } in local coords
mirrorHandle(ax, ay, h)         // symmetric drag handle
```

The preview tracks pen nodes in stage coordinates (mapped from the pointer via the
canvas rect, so it's correct at any zoom), draws the in-progress path, anchors,
and handles live, and on finish localises the nodes into an element box via
`localizePenPath` and adds a `PathElement`.

## Adjusting as you draw

Before finishing, you can grab what you've already placed:

- **Drag an anchor** to move that point (its handles move with it).
- **Drag a handle** to reshape the curve; the opposite handle mirrors it, keeping
  the anchor smooth.
- **Hold Alt while dragging a handle** to break symmetry — the opposite handle
  stays put, giving a corner (cusp) instead of a smooth point.

Handles take priority over anchors when they overlap, so you can always grab a
handle sitting on its point.

## Snapping

When **🧲 Snap** is on, pen **points** snap to the grid (**▦ Grid**), your guides
(**📏 Rulers**), other elements' edges/centres, and the artboard — with the same
pink alignment guides as element editing. Bezier **handles** stay free so curves
aren't constrained.

## Limitations / later

- After finishing, edit the path with the existing path control points, or the
  raw SVG field in Properties.
- Backspace removes points from the end; the first anchor is reserved for closing,
  so it can't be repositioned mid-draw (its handle still can).
