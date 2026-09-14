// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { gridOffsets } from './stagger-grid'
import { createLive } from './live'
import { Stage } from './stage'
import { staggerOffset } from '../../engine'

const rounded = (values: number[]) => values.map((value) => Math.round(value * 1000) / 1000)

describe('gridOffsets', () => {
  it('ripples out from the centre of a grid by distance', () => {
    // 3×3: centre 0, edges 1 cell, corners √2 cells; each 0.1s per cell.
    expect(rounded(gridOffsets(9, { grid: [3, 3], from: 'center', each: 0.1 }))).toEqual(rounded([Math.SQRT2, 1, Math.SQRT2, 1, 0, 1, Math.SQRT2, 1, Math.SQRT2].map((d) => d * 0.1)))
  })

  it('spreads amount across the farthest cell, along one axis, from edges or a ratio', () => {
    expect(rounded(gridOffsets(6, { grid: [2, 3], from: 'start', axis: 'x', amount: 1 }))).toEqual([0, 0.5, 1, 0, 0.5, 1])
    expect(rounded(gridOffsets(5, { from: 'edges', amount: 1 }))).toEqual([0, 0.5, 1, 0.5, 0])
    expect(rounded(gridOffsets(4, { grid: [1, 4], from: [1, 0], amount: 0.3 }))).toEqual([0.3, 0.2, 0.1, 0])
  })

  it('eases the distribution and randomises deterministically', () => {
    expect(rounded(gridOffsets(3, { amount: 1, ease: 'power2.in' }))).toEqual([0, 0.125, 1])
    let seed = 0
    const random = () => (seed = (seed + 0.37) % 1)
    const values = gridOffsets(4, { from: 'random', amount: 1 }, { random })
    expect(values.every((value) => value >= 0 && value <= 1)).toBe(true)
    expect(new Set(values).size).toBe(4)
  })

  it('reads columns from the layout for grid: auto', () => {
    expect(rounded(gridOffsets(6, { grid: 'auto', axis: 'y', each: 1 }, { columnsFromLayout: () => 2 }))).toEqual([0, 0, 1, 1, 2, 2])
  })
})

describe('grid stagger on live', () => {
  it('stores explicit offsets in the JSON and plays them', () => {
    document.body.innerHTML = '<i class="c"></i>'.repeat(9)
    const live = createLive(new Stage({ scheduler: { request: () => 1, cancel: () => {} } }))
    const tl = live.to('.c', { opacity: 0, duration: 0.2, stagger: { grid: [3, 3], from: 'center', amount: 0.5 }, paused: true })
    const [track] = tl.toDefinition().tracks
    expect(track.stagger?.offsets?.[4]).toBe(0)
    expect(track.stagger?.offsets?.[0]).toBeCloseTo(500)
    expect(staggerOffset(1, 9, track.stagger!)).toBeCloseTo(500 / Math.SQRT2)
    expect(tl.duration()).toBeCloseTo(0.7)
  })
})
