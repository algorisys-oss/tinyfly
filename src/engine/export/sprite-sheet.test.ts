import { describe, it, expect } from 'vitest'
import { spriteSheetLayout, frameCell, spriteFrameTimes, spriteSheetMeta } from './sprite-sheet'

describe('spriteSheetLayout', () => {
  it('packs frames into a grid capped at maxColumns', () => {
    const l = spriteSheetLayout(10, 100, 80, 4)
    expect(l.columns).toBe(4)
    expect(l.rows).toBe(3) // ceil(10/4)
    expect(l.sheetWidth).toBe(400)
    expect(l.sheetHeight).toBe(240)
  })

  it('never uses more columns than frames', () => {
    const l = spriteSheetLayout(3, 50, 50, 8)
    expect(l.columns).toBe(3)
    expect(l.rows).toBe(1)
  })

  it('clamps to at least one frame/column', () => {
    const l = spriteSheetLayout(0, 50, 50, 8)
    expect(l.frames).toBe(1)
    expect(l.columns).toBe(1)
    expect(l.rows).toBe(1)
  })
})

describe('frameCell', () => {
  it('computes col/row and pixel origin', () => {
    const l = spriteSheetLayout(10, 100, 80, 4)
    expect(frameCell(0, l)).toEqual({ index: 0, col: 0, row: 0, x: 0, y: 0 })
    expect(frameCell(5, l)).toEqual({ index: 5, col: 1, row: 1, x: 100, y: 80 })
    expect(frameCell(4, l)).toEqual({ index: 4, col: 0, row: 1, x: 0, y: 80 })
  })
})

describe('spriteFrameTimes', () => {
  it('spreads frames evenly, last one short of the end (loop-safe)', () => {
    expect(spriteFrameTimes(4, 1000)).toEqual([0, 250, 500, 750])
  })

  it('clamps to at least one frame', () => {
    expect(spriteFrameTimes(0, 1000)).toEqual([0])
  })
})

describe('spriteSheetMeta', () => {
  it('summarises the sheet for external players', () => {
    const l = spriteSheetLayout(6, 120, 90, 3)
    expect(spriteSheetMeta(l, 12, 500)).toEqual({
      frameWidth: 120,
      frameHeight: 90,
      columns: 3,
      rows: 2,
      frames: 6,
      fps: 12,
      durationMs: 500,
    })
  })
})
