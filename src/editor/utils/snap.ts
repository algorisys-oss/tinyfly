/**
 * Snapping math for the editor stage. Pure and unit-tested; the preview feeds it
 * the moving element's candidate lines (left/center/right, top/middle/bottom) and
 * the static lines to snap against (grid multiples + other elements' edges), and
 * gets back the smallest adjustment plus the line that caught, for drawing a
 * guide. Everything is in stage (artboard) units — the caller converts the
 * pixel threshold by the preview scale.
 */

export interface AxisSnap {
  /** Amount to add to the moving element on this axis to align (0 = no snap). */
  delta: number
  /** The static line the element snapped to, or null when nothing was close. */
  line: number | null
}

/**
 * Find the closest snap on one axis. `movingLines` are the moving element's
 * candidate positions (e.g. its left, centre, right); `staticLines` are the
 * positions to snap to. Returns the delta that aligns the nearest pair within
 * `threshold`, preferring the closest match.
 */
export function snapAxis(movingLines: number[], staticLines: number[], threshold: number): AxisSnap {
  let best: AxisSnap = { delta: 0, line: null }
  let bestDist = threshold
  for (const m of movingLines) {
    for (const s of staticLines) {
      const dist = Math.abs(s - m)
      if (dist <= bestDist) {
        bestDist = dist
        best = { delta: s - m, line: s }
      }
    }
  }
  return best
}

/**
 * Grid snap lines near a set of moving lines: for each moving line, the nearest
 * multiple of `gridSize`. Returns [] when the grid is off (size <= 0), so grid
 * snapping composes with edge snapping by concatenating both static-line sets.
 */
export function gridLinesFor(movingLines: number[], gridSize: number): number[] {
  if (gridSize <= 0) return []
  return movingLines.map((m) => Math.round(m / gridSize) * gridSize)
}
