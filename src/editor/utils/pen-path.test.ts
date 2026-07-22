import { describe, it, expect } from 'vitest'
import { buildPenPath, penNodesBounds, localizePenPath, mirrorHandle } from './pen-path'

describe('buildPenPath', () => {
  it('makes a polyline from anchors without handles', () => {
    const d = buildPenPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], false)
    expect(d).toBe('M 0 0 L 10 0 L 10 10')
  })

  it('closes with a Z when closed', () => {
    const d = buildPenPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], true)
    expect(d).toBe('M 0 0 L 10 0 L 10 10 L 0 0 Z')
  })

  it('emits a cubic when a handle is present', () => {
    const d = buildPenPath(
      [{ x: 0, y: 0, hOut: { x: 5, y: -5 } }, { x: 10, y: 0, hIn: { x: 5, y: 5 } }],
      false
    )
    expect(d).toBe('M 0 0 C 5 -5 5 5 10 0')
  })

  it('falls back to the anchor for a missing handle on a curved segment', () => {
    const d = buildPenPath([{ x: 0, y: 0, hOut: { x: 5, y: -5 } }, { x: 10, y: 0 }], false)
    expect(d).toBe('M 0 0 C 5 -5 10 0 10 0')
  })

  it('is empty with no nodes', () => {
    expect(buildPenPath([], false)).toBe('')
  })
})

describe('penNodesBounds', () => {
  it('includes handles in the box', () => {
    const b = penNodesBounds([{ x: 0, y: 0, hOut: { x: -10, y: 0 } }, { x: 20, y: 20 }])
    expect(b).toEqual({ x: -10, y: 0, width: 30, height: 20 })
  })
})

describe('localizePenPath', () => {
  it('shifts nodes + handles into a local box', () => {
    const { x, y, width, height, d } = localizePenPath(
      [{ x: 100, y: 100 }, { x: 140, y: 120 }],
      false
    )
    expect({ x, y, width, height }).toEqual({ x: 100, y: 100, width: 40, height: 20 })
    expect(d).toBe('M 0 0 L 40 20')
  })
})

describe('mirrorHandle', () => {
  it('reflects a handle across the anchor', () => {
    expect(mirrorHandle(10, 10, { x: 15, y: 12 })).toEqual({ x: 5, y: 8 })
  })
})
