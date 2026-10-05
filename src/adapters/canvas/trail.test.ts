import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { drawTrail, trailQuads } from './trail'
import { trailSamples } from '../../engine/path/trail'

const W = 200
const H = 60
const canvas = () => {
  const ctx = createCanvas(W, H).getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  return ctx
}
const at = (ctx: CanvasRenderingContext2D, x: number, y: number) => [...ctx.getImageData(x, y, 1, 1).data]
// Left to right across the canvas, the head at x = 190.
const straight = trailSamples((t) => ({ x: 10 + t, y: 30 }), 180, { length: 180, samples: 37 })

describe('drawTrail', () => {
  it('a solid band shows no seams where its segments meet', () => {
    const ctx = canvas()
    drawTrail(ctx, straight, { color: '#0000ff', width: 12, taper: 0, fade: 0 })
    // Joints every 5 px: every pixel along the middle is fully blue.
    for (let x = 20; x < 185; x++) expect(at(ctx, x, 30)).toEqual([0, 0, 255, 255])
  })

  it('narrows and fades toward the tail', () => {
    const ctx = canvas()
    drawTrail(ctx, straight, { color: '#0000ff', width: 12 })
    const blueness = (x: number) => 255 - at(ctx, x, 30)[0]
    expect(blueness(180)).toBeGreaterThan(blueness(100))
    expect(blueness(100)).toBeGreaterThan(blueness(30))
    // Near the head it is wider than near the tail.
    expect(at(ctx, 180, 34)[0]).toBeLessThan(255)
    expect(at(ctx, 40, 34)[0]).toBe(255)
  })

  it('adds light where trails cross, in `add` blend', () => {
    const ctx = createCanvas(W, H).getContext('2d') as unknown as CanvasRenderingContext2D
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)
    const across = trailSamples((t) => ({ x: 100, y: t / 3 }), 180, { length: 180, samples: 20 })
    drawTrail(ctx, straight, { color: '#800000', width: 10, taper: 0, fade: 0, blend: 'add' })
    drawTrail(ctx, across, { color: '#800000', width: 10, taper: 0, fade: 0, blend: 'add' })
    expect(at(ctx, 100, 30)[0]).toBeGreaterThan(at(ctx, 60, 30)[0] + 100)
  })

  it('draws at the canvas transform, and the head where the trail ends', () => {
    const ctx = createCanvas(W * 2, H * 2).getContext('2d') as unknown as CanvasRenderingContext2D
    ctx.scale(2, 2)
    drawTrail(ctx, straight, { color: '#00ff00', width: 6, taper: 0, fade: 0, head: { radius: 8, color: '#ff0000' } })
    expect(at(ctx, 200, 60)[1]).toBe(255)
    expect(at(ctx, 380, 60)[0]).toBeGreaterThan(200)
    expect(at(ctx, 200, 90)[3]).toBe(0)
  })

  it('draws the same every time', () => {
    const a = canvas()
    const b = canvas()
    drawTrail(a, straight, { color: '#ff2bd6', width: 9, head: { radius: 6 } })
    drawTrail(b, straight, { color: '#ff2bd6', width: 9, head: { radius: 6 } })
    const da = a.getImageData(0, 0, W, H).data
    const db = b.getImageData(0, 0, W, H).data
    expect(da.every((v, i) => v === db[i])).toBe(true)
  })

  it('one quad per segment; the head segment carries the round end', () => {
    const quads = trailQuads(straight, 10, 0, 1, 1)
    expect(quads).toHaveLength(36)
    expect(quads[quads.length - 1].cap).toBeDefined()
    expect(quads[0].cap).toBeUndefined()
  })
})
