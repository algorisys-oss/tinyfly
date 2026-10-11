import { describe, it, expect } from 'vitest'
import { nestedZoom, nestedZoomTransform } from './nested-zoom'
import { applySimilarity, similarityAbout } from '../../engine/path/similarity'

/** A context that records its transforms. */
function fakeContext() {
  const calls: string[] = []
  const ctx = {
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    transform: (...m: number[]) => calls.push(`transform ${m.map((v) => v.toFixed(3)).join(',')}`),
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls }
}

describe('nestedZoom', () => {
  const step = similarityAbout(0.5, 10, { x: 100, y: 100 })

  it('draws the levels that show, biggest first, and skips sub-pixel ones', () => {
    const { ctx, calls } = fakeContext()
    const drawn: Array<[number, number]> = []
    const levels = nestedZoom(ctx, { step, phase: 0, extent: 200, minSize: 1, draw: (_c, level, scale) => drawn.push([level, scale]) })
    expect(levels).toEqual([-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7])
    expect(drawn.map(([level]) => level)).toEqual(levels)
    expect(drawn[4]).toEqual([0, 1])
    expect(drawn[11][1] * 200).toBeGreaterThanOrEqual(1)
    expect(0.5 ** 8 * 200).toBeLessThan(1)
    expect(calls.filter((c) => c === 'save').length).toBe(levels.length)
    expect(calls.filter((c) => c === 'restore').length).toBe(levels.length)
  })

  it('skips everything behind a level that covers the frame', () => {
    const { ctx } = fakeContext()
    expect(nestedZoom(ctx, { step, phase: 0, extent: 200, coversAbove: 1, draw: () => {} })).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    // Half a step in, level 0 is 1.41× and still covers; with a stricter cover size, level −1 (2.83×) is the first drawn.
    expect(nestedZoom(ctx, { step, phase: 0.5, extent: 200, coversAbove: 1, draw: () => {} })[0]).toBe(0)
    expect(nestedZoom(ctx, { step, phase: 0.5, extent: 200, coversAbove: 2, draw: () => {} })[0]).toBe(-1)
    expect(nestedZoom(ctx, { step, phase: 0, extent: 200, levels: [2, 3], draw: () => {} })).toEqual([2, 3])
  })

  it('closes: one step later, every level is where the next one was', () => {
    const p = { x: 30, y: 170 }
    for (const level of [-2, 0, 3]) {
      const now = applySimilarity(nestedZoomTransform(step, level, 1), p)
      const next = applySimilarity(nestedZoomTransform(step, level - 1, 0), p)
      expect(now.x).toBeCloseTo(next.x, 9)
      expect(now.y).toBeCloseTo(next.y, 9)
    }
    // Level 0 at phase 0 is drawn as is.
    expect(nestedZoomTransform(step, 0, 0)).toEqual({ scale: 1, turn: 0, x: 0, y: 0 })
  })
})
