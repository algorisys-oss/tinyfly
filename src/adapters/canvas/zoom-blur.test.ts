import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { applyZoomBlur, drawDiveLines } from './zoom-blur'
import { drawIsometricFaces } from './impossible'
import { penroseTriangle } from '../../engine/path/impossible'

const scene = () => {
  const canvas = createCanvas(200, 120)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 200, 120)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(150, 55, 10, 10)
  return { canvas, ctx }
}
const lit = (ctx: CanvasRenderingContext2D) => {
  const data = ctx.getImageData(0, 0, 200, 120).data
  let count = 0
  for (let i = 0; i < data.length; i += 4) if (data[i] > 20) count++
  return count
}

describe('zoom blur and dive lines', () => {
  it('streaks what is drawn away from the centre, the same every time', () => {
    const plain = lit(scene().ctx)
    const a = scene()
    applyZoomBlur(a.ctx, { strength: 0.3, samples: 6 })
    const b = scene()
    applyZoomBlur(b.ctx, { strength: 0.3, samples: 6 })
    expect(lit(a.ctx)).toBeGreaterThan(plain * 2)
    expect(Buffer.from(a.ctx.getImageData(0, 0, 200, 120).data).equals(Buffer.from(b.ctx.getImageData(0, 0, 200, 120).data))).toBe(true)
    // The streak runs outward from the centre (x 100): light appears right of the square, not left of the centre.
    const row = a.ctx.getImageData(0, 60, 200, 1).data
    const at = (x: number) => row[x * 4]
    expect(at(175)).toBeGreaterThan(20)
    expect(at(60)).toBe(0)
  })

  it('draws seeded lines that loop with the phase', () => {
    const draw = (phase: number, seed = 'dive') => {
      const { ctx } = scene()
      drawDiveLines(ctx, { phase, seed, count: 20 })
      return ctx.getImageData(0, 0, 200, 120).data
    }
    const a = draw(0)
    expect(a.filter((_, i) => i % 4 === 0 && a[i] > 20).length).toBeGreaterThan(100)
    expect(Buffer.from(draw(0)).equals(Buffer.from(a))).toBe(true)
    expect(Buffer.from(draw(1)).equals(Buffer.from(a))).toBe(true)
    expect(Buffer.from(draw(0.5)).equals(Buffer.from(a))).toBe(false)
    expect(Buffer.from(draw(0, 'other')).equals(Buffer.from(a))).toBe(false)
  })

  it('fills isometric faces by side, with a fill per face and outlines', () => {
    const { ctx } = scene()
    const { faces } = penroseTriangle({ centre: { x: 100, y: 60 }, scale: 6, size: 10, thickness: 2 })
    drawIsometricFaces(ctx, faces, { top: '#ff0000', left: '#00ff00', right: '#0000ff', fill: (face) => (face.tag === 2 ? '#ffff00' : undefined), outline: '#ffffff' })
    const data = ctx.getImageData(0, 0, 200, 120).data
    const colours = new Set<string>()
    for (let i = 0; i < data.length; i += 4) colours.add(`${data[i]},${data[i + 1]},${data[i + 2]}`)
    for (const colour of ['255,0,0', '0,255,0', '0,0,255', '255,255,0', '255,255,255']) expect(colours.has(colour), colour).toBe(true)
  })
})
