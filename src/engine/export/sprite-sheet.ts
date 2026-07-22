/**
 * Sprite-sheet layout. Pure and unit-tested: given a frame count and per-frame
 * size it lays the frames out in a grid and reports where each one goes, so the
 * export code (and any consumer) can place frames and write matching metadata.
 */

export interface SpriteLayout {
  /** Total frames in the sheet. */
  frames: number
  columns: number
  rows: number
  frameWidth: number
  frameHeight: number
  sheetWidth: number
  sheetHeight: number
}

export interface SpriteCell {
  index: number
  col: number
  row: number
  x: number
  y: number
}

/**
 * Lay `frames` cells of `frameWidth` x `frameHeight` into a grid at most
 * `maxColumns` wide (packed left-to-right, top-to-bottom).
 */
export function spriteSheetLayout(
  frames: number,
  frameWidth: number,
  frameHeight: number,
  maxColumns = 8
): SpriteLayout {
  const n = Math.max(1, Math.floor(frames))
  const columns = Math.max(1, Math.min(Math.floor(maxColumns) || 1, n))
  const rows = Math.ceil(n / columns)
  return {
    frames: n,
    columns,
    rows,
    frameWidth,
    frameHeight,
    sheetWidth: columns * frameWidth,
    sheetHeight: rows * frameHeight,
  }
}

/** Grid position (col/row) and pixel origin (x/y) of a frame in the sheet. */
export function frameCell(index: number, layout: SpriteLayout): SpriteCell {
  const col = index % layout.columns
  const row = Math.floor(index / layout.columns)
  return { index, col, row, x: col * layout.frameWidth, y: row * layout.frameHeight }
}

/**
 * Sample times (ms) for `frames` evenly spread across `durationMs`. The last
 * frame lands one step short of the end so a looping animation doesn't repeat
 * the first pose (frame i → i/frames of the duration).
 */
export function spriteFrameTimes(frames: number, durationMs: number): number[] {
  const n = Math.max(1, Math.floor(frames))
  const times: number[] = []
  for (let i = 0; i < n; i++) times.push((i / n) * durationMs)
  return times
}

/** JSON metadata describing a rendered sheet (portable to game engines/players). */
export interface SpriteSheetMeta {
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  frames: number
  fps: number
  durationMs: number
}

export function spriteSheetMeta(layout: SpriteLayout, fps: number, durationMs: number): SpriteSheetMeta {
  return {
    frameWidth: layout.frameWidth,
    frameHeight: layout.frameHeight,
    columns: layout.columns,
    rows: layout.rows,
    frames: layout.frames,
    fps,
    durationMs,
  }
}
