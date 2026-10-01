import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { circlePath, drawHand, drawnPathTarget } from './hand'
import { erasable } from './erase'
import type { CustomTarget } from '../adapters/canvas'

const context = () => createCanvas(600, 400).getContext('2d') as unknown as CanvasRenderingContext2D

function white() {
  const ctx = context()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 600, 400)
  return ctx
}

/** Whether any pixel in the box is skin-coloured (the hand's default skin). */
function skin(ctx: CanvasRenderingContext2D, x = 0, y = 0, w = 600, h = 400): boolean {
  const data = ctx.getImageData(x, y, w, h).data
  for (let i = 0; i < data.length; i += 4) {
    if (Math.abs(data[i] - 0xf1) < 6 && Math.abs(data[i + 1] - 0xc9) < 6 && Math.abs(data[i + 2] - 0xa5) < 6) return true
  }
  return false
}

function inked(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): boolean {
  const data = ctx.getImageData(x, y, w, h).data
  for (let i = 0; i < data.length; i += 4) if (data[i] < 100 && data[i + 1] < 100) return true
  return false
}

/** Draw a custom target with a prop set, the way the canvas adapter would. */
function drawTarget(target: CustomTarget, props: Record<string, number>, ctx = white()) {
  ctx.save()
  ctx.translate(target.x, target.y)
  target.draw(ctx, { ...target, props: { ...target.props, ...props } }, 0)
  ctx.restore()
  return ctx
}

describe('drawHand', () => {
  it('holds the tool with its tip at the point, the hand up and to the right of it', () => {
    const ctx = white()
    drawHand(ctx, { x: 100, y: 300 })
    expect(inked(ctx, 96, 296, 8, 8)).toBe(true) // the pencil's point
    expect(skin(ctx, 120, 150, 250, 150)).toBe(true)
    expect(skin(ctx, 0, 310, 90, 90)).toBe(false) // nothing below-left of the tip
  })

  it('holds an eraser too', () => {
    const ctx = white()
    drawHand(ctx, { x: 100, y: 300 }, { tool: 'eraser' })
    const [r, g, b] = ctx.getImageData(112, 292, 1, 1).data
    expect(r > 200 && g < 200 && b > 150).toBe(true) // pink rubber near the tip
  })
})

describe('circlePath', () => {
  it('starts at the top and runs a little past a full turn', () => {
    const points = circlePath(100, 100, 50, 0.1, 40)
    expect(points[0].x).toBeCloseTo(100)
    expect(points[0].y).toBeCloseTo(50)
    expect(points[40].x).toBeGreaterThan(100) // past the top again
    for (const p of points) expect(Math.hypot(p.x - 100, p.y - 100)).toBeCloseTo(50)
  })
})

describe('drawnPathTarget', () => {
  const path = [{ x: 50, y: 300 }, { x: 550, y: 300 }]

  it('boxes the path and exposes a draw prop', () => {
    const target = drawnPathTarget({ path })
    expect([target.x, target.y, target.width]).toEqual([50, 300, 500])
    expect(target.props).toEqual({ draw: 0 })
  })

  it('draws on with the hand at the end of the line, and without it once done', () => {
    for (const sketch of [undefined, { roughness: 2 }]) {
      const target = drawnPathTarget({ path, sketch })
      const none = drawTarget(target, { draw: 0 })
      expect(inked(none, 0, 290, 600, 20)).toBe(false)
      expect(skin(none)).toBe(false)

      const half = drawTarget(target, { draw: 0.5 })
      expect(inked(half, 60, 290, 150, 20)).toBe(true)
      expect(inked(half, 330, 296, 200, 8)).toBe(false)
      expect(skin(half)).toBe(true)

      const done = drawTarget(target, { draw: 1 })
      expect(inked(done, 400, 290, 140, 20)).toBe(true)
      expect(skin(done)).toBe(false)
    }
  })

  it('can hide the hand', () => {
    expect(skin(drawTarget(drawnPathTarget({ path, hand: false }), { draw: 0.5 }))).toBe(false)
  })
})

describe('erasable with a hand', () => {
  it('shows a hand holding the eraser while it rubs', () => {
    const block: CustomTarget = { type: 'custom', x: 0, y: 0, width: 600, height: 400, draw() {} }
    const target = erasable(block, { path: [{ x: 50, y: 350 }, { x: 300, y: 350 }], hand: true })
    expect(skin(drawTarget(target, { erase: 0.5 }))).toBe(true)
    expect(skin(drawTarget(target, { erase: 1 }))).toBe(false)
    const bare = erasable(block, { path: [{ x: 50, y: 350 }, { x: 300, y: 350 }] })
    expect(skin(drawTarget(bare, { erase: 0.5 }))).toBe(false)
  })
})
