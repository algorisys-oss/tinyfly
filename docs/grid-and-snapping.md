# Grid & snapping

Line elements up quickly: a toggleable grid overlay plus snapping that pulls a
dragged element to the grid, to other elements, and to the artboard centre —
with pink alignment guides that appear as you drag.

## Using it

In the **DOM** preview (the editing surface) the header shows two toggles:

- **▦ Grid** — overlays a 20px grid on the artboard.
- **🧲 Snap** — snaps dragged elements (on by default).

Drag an element and, when an edge / centre lines up with a snap target within a
few pixels, it clicks into place and a **pink guide line** shows what it caught.

Snapping considers, per axis:

- the moving element's **left / centre / right** (and **top / middle / bottom**),
- against every **other element's** edges and centre,
- the **artboard** edges and centre,
- and the **grid** (only while ▦ Grid is on).

Grid and snapping are **editor-only** — they never change the animation or the
saved JSON.

## How it works

`src/editor/utils/snap.ts` is pure and unit-tested:

```ts
snapAxis(movingLines, staticLines, threshold)  // → { delta, line }
gridLinesFor(movingLines, gridSize)            // nearest grid multiple per line
```

The preview (`preview-panel.tsx`) captures the element's bounds at drag start,
builds the static lines from the other elements + artboard, appends grid lines,
and asks `snapAxis` for the smallest nudge on each axis. The caught line is
published to `guideX` / `guideY` and drawn as a guide. The pixel threshold is
divided by the preview scale so the feel is constant at any zoom.

## Resize snapping

Resizing snaps too: the edge (or corner) you drag snaps to the same targets —
grid, other elements' edges/centres, and the artboard — with the pink guide
showing what caught. Each handle drives specific edges (e.g. **e** snaps the
right edge, **se** snaps right + bottom, **n** snaps the top). Holding **Shift**
to lock the aspect ratio turns snapping off for that drag so the two don't fight.

## Rulers & guides

Toggle **📏 Rulers** to show rulers along the top and left of the stage. **Drag
out of a ruler** to drop a guide line — down from the top ruler for a vertical
guide, right from the left ruler for a horizontal one. Guides are cyan, can be
**dragged to reposition**, and are removed by **dropping them off the stage**.

While the rulers are shown, dragged and resized elements **snap to your guides**
too (alongside the grid, elements, and artboard). Guides are editor-only — never
part of the animation or the saved JSON.

## Limitations / later

- Rulers show tick marks but not numeric labels yet.
- Grid size (20px) is fixed for now.
