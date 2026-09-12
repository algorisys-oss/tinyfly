import { describe, it, expect } from 'vitest'
import { snapAxis, gridLinesFor } from './snap'

describe('snapAxis', () => {
  it('snaps the moving line to the nearest static line within threshold', () => {
    // left edge at 102, a static line at 100 → delta -2
    expect(snapAxis([102], [100, 300], 5)).toEqual({ delta: -2, line: 100 })
  })

  it('does not snap when nothing is within threshold', () => {
    expect(snapAxis([102], [100], 1)).toEqual({ delta: 0, line: null })
  })

  it('prefers the closest pair across multiple moving lines', () => {
    // moving left=0, center=50, right=100; static 52 is closest to center → delta +2
    const r = snapAxis([0, 50, 100], [52, 300], 5)
    expect(r).toEqual({ delta: 2, line: 52 })
  })

  it('reports the caught line so the caller can draw a guide', () => {
    expect(snapAxis([198], [200], 5).line).toBe(200)
  })
})

describe('gridLinesFor', () => {
  it('rounds each moving line to the nearest grid multiple', () => {
    expect(gridLinesFor([23, 57], 20)).toEqual([20, 60])
  })

  it('is empty when the grid is off', () => {
    expect(gridLinesFor([23], 0)).toEqual([])
    expect(gridLinesFor([23], -10)).toEqual([])
  })

  it('composes with edge snapping via concatenated static lines', () => {
    // element left at 22, grid 20 → grid line 20; snap within threshold 5
    const grid = gridLinesFor([22], 20)
    expect(snapAxis([22], grid, 5)).toEqual({ delta: -2, line: 20 })
  })
})
