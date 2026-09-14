import { getEasingFunction } from '../../engine'
import { mapEase } from './ease-map'

/**
 * GSAP's advanced stagger — `grid`, `from: 'random'` or `[x, y]`, `axis` and
 * `ease` — worked out into one explicit offset per target (milliseconds). The
 * engine stores them as `stagger.offsets`, so the result is still plain JSON.
 *
 *     stagger: { grid: [5, 8], from: 'center', amount: 1.2, ease: 'power2.in' }
 *
 * Distances are measured in grid cells from the origin (Euclidean, or along one
 * `axis`), then scaled: `amount` is the total spread, `each` the time per cell.
 */

export type GridFrom = 'start' | 'end' | 'center' | 'edges' | 'random' | number | [number, number]

export interface GridStagger {
  each?: number
  amount?: number
  from?: GridFrom
  /** `[rows, columns]`, or `'auto'` to read rows from the layout */
  grid?: [number, number] | 'auto'
  axis?: 'x' | 'y'
  ease?: string
}

/** Whether a stagger needs explicit offsets rather than the engine's 1D forms. */
export function needsExplicitOffsets(stagger: unknown): boolean {
  if (typeof stagger !== 'object' || stagger === null) return false
  const value = stagger as GridStagger
  return value.grid !== undefined || value.from === 'random' || Array.isArray(value.from) || value.ease !== undefined || value.axis !== undefined
}

/**
 * Offsets in seconds for `count` targets. `columnsFromLayout` answers `grid: 'auto'`
 * (how many targets share the first row); `random` draws for `from: 'random'`.
 */
export function gridOffsets(count: number, stagger: GridStagger, options: { columnsFromLayout?: () => number; random?: () => number } = {}): number[] {
  if (count === 0) return []
  const columns =
    stagger.grid === 'auto'
      ? Math.max(1, Math.min(count, options.columnsFromLayout?.() ?? count))
      : Array.isArray(stagger.grid)
        ? Math.max(1, stagger.grid[1])
        : count
  const rows = Array.isArray(stagger.grid) ? Math.max(1, stagger.grid[0]) : Math.ceil(count / columns)
  const cell = (index: number) => ({ x: index % columns, y: Math.floor(index / columns) })

  const from = stagger.from ?? 'start'
  const origin =
    Array.isArray(from)
      ? { x: from[0] * (columns - 1), y: from[1] * (rows - 1) }
      : typeof from === 'number'
        ? cell(Math.max(0, Math.min(count - 1, from)))
        : from === 'end'
          ? cell(count - 1)
          : from === 'center' || from === 'edges'
            ? { x: (columns - 1) / 2, y: (rows - 1) / 2 }
            : { x: 0, y: 0 }

  const distanceOf = (index: number) => {
    const { x, y } = cell(index)
    const dx = Math.abs(x - origin.x)
    const dy = Math.abs(y - origin.y)
    return stagger.axis === 'x' ? dx : stagger.axis === 'y' ? dy : Math.hypot(dx, dy)
  }

  let distances = Array.from({ length: count }, (_, index) => distanceOf(index))
  const max = Math.max(...distances)
  if (from === 'edges') distances = distances.map((distance) => max - distance)
  if (from === 'random') {
    const random = options.random ?? Math.random
    distances = distances.map(() => random() * max)
  }

  const total = stagger.amount !== undefined ? stagger.amount : (stagger.each ?? 0) * max
  const mapped = stagger.ease ? mapEase(stagger.ease) : undefined
  const ease = mapped ? (mapped.fn ?? getEasingFunction(mapped.easing)) : undefined
  return distances.map((distance) => {
    const fraction = max === 0 ? 0 : distance / max
    return (ease ? ease(fraction) : fraction) * total
  })
}
