import { describe, it, expect } from 'vitest'
import { bubblePath, bubblePop, dripPath, metaballContours, metaballField, scalePoints, squashStretch } from './goo'

const area = (poly: Array<{ x: number; y: number }>) => Math.abs(poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p.x * q.y - q.x * p.y }, 0) / 2)
const centre = (poly: Array<{ x: number; y: number }>) => ({ x: poly.reduce((s, p) => s + p.x, 0) / poly.length, y: poly.reduce((s, p) => s + p.y, 0) / poly.length })

describe('metaballs', () => {
  it('trace one ball as a circle of its radius, and merge two that are near', () => {
    const one = metaballContours([{ x: 50, y: 50, r: 20 }], { cell: 2 })
    expect(one).toHaveLength(1)
    const c = centre(one[0])
    expect(Math.abs(c.x - 50)).toBeLessThan(1.5)
    expect(Math.abs(c.y - 50)).toBeLessThan(1.5)
    const radii = one[0].map((p) => Math.hypot(p.x - 50, p.y - 50))
    expect(Math.min(...radii)).toBeGreaterThan(18)
    expect(Math.max(...radii)).toBeLessThan(22)
    expect(metaballField([{ x: 0, y: 0, r: 10 }], 10, 0)).toBeCloseTo(1, 9)
    const apart = metaballContours([{ x: 0, y: 0, r: 10 }, { x: 100, y: 0, r: 10 }], { cell: 2 })
    expect(apart).toHaveLength(2)
    const near = metaballContours([{ x: 0, y: 0, r: 10 }, { x: 24, y: 0, r: 10 }], { cell: 2 })
    expect(near).toHaveLength(1)
    expect(area(near[0])).toBeGreaterThan(Math.PI * 100 * 2 * 0.9)
    // The same every time, and sharper without smoothing.
    expect(metaballContours([{ x: 0, y: 0, r: 10 }], { cell: 2 })).toEqual(metaballContours([{ x: 0, y: 0, r: 10 }], { cell: 2 }))
    expect(metaballContours([{ x: 0, y: 0, r: 10 }], { cell: 2, smooth: false })[0].length).toBeLessThan(one[0].length)
    expect(metaballContours([])).toEqual([])
  })
})

describe('drips, bubbles and squash', () => {
  it('a drip reaches further and swells as it progresses, and is nothing at 0', () => {
    expect(dripPath({ x: 0, y: 0, length: 60, width: 10, progress: 0 })).toEqual([])
    const early = dripPath({ x: 0, y: 0, length: 60, width: 10, progress: 0.2 })
    const late = dripPath({ x: 0, y: 0, length: 60, width: 10, progress: 1 })
    const bottom = (poly: Array<{ y: number }>) => Math.max(...poly.map((p) => p.y))
    expect(bottom(early)).toBeLessThan(bottom(late))
    expect(bottom(late)).toBeCloseTo(60, 0)
    // The head is wider than the top of the neck at the end.
    expect(Math.max(...late.map((p) => Math.abs(p.x)))).toBeGreaterThan(5)
    expect(area(late)).toBeGreaterThan(area(early))
  })

  it('a bubble grows from nothing, wobbles with the time and repeats over a period, then pops into pieces', () => {
    expect(bubblePath({ x: 0, y: 0, r: 30, grow: 0 })).toEqual([])
    const full = bubblePath({ x: 0, y: 0, r: 30, time: 0 })
    const radii = full.map((p) => Math.hypot(p.x, p.y))
    expect(Math.min(...radii)).toBeGreaterThan(30 * 0.94)
    expect(Math.max(...radii)).toBeLessThan(30 * 1.06)
    expect(bubblePath({ x: 0, y: 0, r: 30, time: 200 })).not.toEqual(full)
    expect(bubblePath({ x: 0, y: 0, r: 30, time: 4000, period: 4000 })).toEqual(bubblePath({ x: 0, y: 0, r: 30, time: 0, period: 4000 }))
    expect(area(bubblePath({ x: 0, y: 0, r: 30, grow: 0.5 }))).toBeLessThan(area(full))
    expect(bubblePop({ x: 0, y: 0, r: 30, progress: 0 })).toEqual([])
    expect(bubblePop({ x: 0, y: 0, r: 30, progress: 1 })).toEqual([])
    const pieces = bubblePop({ x: 0, y: 0, r: 30, progress: 0.5, pieces: 6 })
    expect(pieces).toHaveLength(6)
    expect(Math.hypot(pieces[0][0].x, pieces[0][0].y)).toBeGreaterThan(30)
  })

  it('squash and stretch keeps the area, or the volume', () => {
    const area2 = squashStretch(0.5)
    expect(area2.sx * area2.sy).toBeCloseTo(1, 9)
    const volume = squashStretch(0.5, { keep: 'volume' })
    expect(volume.sx * volume.sx * volume.sy).toBeCloseTo(1, 9)
    expect(squashStretch(-0.3).sy).toBeCloseTo(0.7, 9)
    const circle = Array.from({ length: 64 }, (_, i) => ({ x: 10 + Math.cos((i / 64) * Math.PI * 2) * 5, y: 20 + Math.sin((i / 64) * Math.PI * 2) * 5 }))
    const squashed = scalePoints(circle, squashStretch(-0.4), { x: 10, y: 25 })
    expect(area(squashed)).toBeCloseTo(area(circle), 6)
    expect(Math.max(...squashed.map((p) => p.y))).toBeCloseTo(25, 9)
  })
})
