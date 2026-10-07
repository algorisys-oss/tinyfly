/**
 * A place on a surface, scene px: a line of code, a word, a bar of a chart,
 * a note on a board. A figure stands on `top`, points at `x`, `y` (the
 * centre) and swipes from `left` to `right`, so a box is a beat's target as
 * it is.
 */
export interface SurfaceBox {
  x: number
  y: number
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

/** The box with this top-left corner and size. */
export function surfaceBox(left: number, top: number, width: number, height: number): SurfaceBox {
  return {
    x: left + width / 2,
    y: top + height / 2,
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height,
  }
}
