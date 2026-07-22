# Sprite-sheet export

Export an animation as a **sprite sheet**: every frame packed into one PNG grid,
plus a JSON metadata file. This is the format game engines (Phaser, Unity, Godot,
PixiJS) and custom `<canvas>` players expect.

## Using it

1. Open **Export** and choose **Sprite**.
2. Set the **FPS** (frame count = duration × fps) and **scale** (each frame is the
   scaled artboard size). Turn on **Transparent** for an alpha PNG.
3. Click **Export SPRITE**. You get two files:
   - `name-spritesheet.png` — the grid of frames (up to 8 columns).
   - `name-spritesheet.json` — the metadata below.

## Metadata

```json
{
  "frameWidth": 200,
  "frameHeight": 200,
  "columns": 8,
  "rows": 4,
  "frames": 30,
  "fps": 30,
  "durationMs": 1000
}
```

Frames are packed left-to-right, top-to-bottom; frame `i` sits at
`col = i % columns`, `row = floor(i / columns)`, pixel origin
`(col × frameWidth, row × frameHeight)`. Frames are sampled evenly across the
duration (`i / frames`), so a looping clip doesn't repeat the first pose.

## How it works

The layout math is a pure, unit-tested helper:

```ts
// src/engine/export/sprite-sheet.ts
spriteSheetLayout(frames, frameWidth, frameHeight, maxColumns)  // grid + sheet size
frameCell(index, layout)                                        // cell col/row/x/y
spriteFrameTimes(frames, durationMs)                            // sample times
spriteSheetMeta(layout, fps, durationMs)                        // JSON metadata
```

The export dialog reuses the **same per-frame `draw`** as GIF/WebP/MP4 (so shapes,
text, paths, images, video layers, symbols, and the camera all composite in),
translating and clipping it into each cell.

## Limitations / later

- Max 8 columns (keeps sheets reasonably square); configurable later.
- Very long / high-fps clips make large PNGs — lower the fps or scale if needed.
