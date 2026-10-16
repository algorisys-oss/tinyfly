import type { Vec2 } from '../linear/vec2'

/**
 * Level curves of a sampled function by marching squares: for each level,
 * the line segments where the grid crosses it, joined into polylines.
 * `values[j][i]` is f at x = x0 + i·dx, y = y0 + j·dy. Pure.
 */
export function contourLines(values: number[][], x0: number, y0: number, dx: number, dy: number, level: number): Vec2[][] {
  // A sample exactly on the level would make zero-length and branching pieces; a nudge far below
  // drawing precision keeps every crossing strictly between two samples.
  level += 1e-9 * Math.max(1, Math.abs(level))
  const segments: [Vec2, Vec2][] = []
  const rows = values.length
  const cols = values[0]?.length ?? 0
  const edge = (i0: number, j0: number, i1: number, j1: number): Vec2 => {
    // Always from the lower-indexed end, so the two cells sharing an edge get the very same point.
    if (j0 > j1 || (j0 === j1 && i0 > i1)) [i0, j0, i1, j1] = [i1, j1, i0, j0]
    const a = values[j0][i0] - level
    const b = values[j1][i1] - level
    const t = a === b ? 0.5 : a / (a - b)
    return [x0 + (i0 + (i1 - i0) * t) * dx, y0 + (j0 + (j1 - j0) * t) * dy]
  }
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const corners = [values[j][i], values[j][i + 1], values[j + 1][i + 1], values[j + 1][i]]
      if (corners.some((v) => !Number.isFinite(v))) continue
      // Edges: bottom (0–1), right (1–2), top (2–3), left (3–0), each with its crossing if any.
      const crossings: Vec2[] = []
      const pairs: [number, number, number, number, number, number][] = [
        [0, 1, i, j, i + 1, j], [1, 2, i + 1, j, i + 1, j + 1], [2, 3, i + 1, j + 1, i, j + 1], [3, 0, i, j + 1, i, j],
      ]
      for (const [a, b, ia, ja, ib, jb] of pairs) {
        if ((corners[a] >= level) !== (corners[b] >= level)) crossings.push(edge(ia, ja, ib, jb))
      }
      if (crossings.length === 2) segments.push([crossings[0], crossings[1]])
      else if (crossings.length === 4) {
        // A saddle: pair the crossings by the centre's side.
        const centre = (corners[0] + corners[1] + corners[2] + corners[3]) / 4 >= level
        const first = corners[0] >= level
        if (centre === first) {
          segments.push([crossings[0], crossings[1]], [crossings[2], crossings[3]])
        } else {
          segments.push([crossings[0], crossings[3]], [crossings[1], crossings[2]])
        }
      }
    }
  }
  // Pieces far shorter than a cell (a crossing right at a sample) only break the chains.
  const tiny = 1e-6 * Math.min(Math.abs(dx), Math.abs(dy))
  return joinSegments(segments.filter(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]) > tiny))
}

/** Chains segments that share endpoints into polylines. */
function joinSegments(segments: [Vec2, Vec2][]): Vec2[][] {
  const key = ([x, y]: Vec2) => `${Math.round(x * 1e6)},${Math.round(y * 1e6)}`
  const byEnd = new Map<string, number[]>()
  segments.forEach(([a, b], k) => {
    for (const p of [a, b]) byEnd.set(key(p), [...(byEnd.get(key(p)) ?? []), k])
  })
  const used = new Set<number>()
  const lines: Vec2[][] = []
  const extend = (line: Vec2[]) => {
    for (;;) {
      const tail = line[line.length - 1]
      const next = (byEnd.get(key(tail)) ?? []).find((k) => !used.has(k))
      if (next === undefined) return
      used.add(next)
      const [a, b] = segments[next]
      line.push(key(a) === key(tail) ? b : a)
    }
  }
  segments.forEach(([a, b], k) => {
    if (used.has(k)) return
    used.add(k)
    const line: Vec2[] = [a, b]
    extend(line)
    line.reverse()
    extend(line)
    lines.push(line)
  })
  return lines
}

/** f sampled on a grid over [x0, x1] × [y0, y1] with `n` + 1 points each way. */
export function sampleGrid(f: (x: number, y: number) => number, [x0, x1]: [number, number], [y0, y1]: [number, number], n: number) {
  const dx = (x1 - x0) / n
  const dy = (y1 - y0) / n
  const values = Array.from({ length: n + 1 }, (_, j) => Array.from({ length: n + 1 }, (_, i) => f(x0 + i * dx, y0 + j * dy)))
  return { values, x0, y0, dx, dy }
}
