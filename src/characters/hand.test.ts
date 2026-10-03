import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { circlePath, drawHand, drawnPathTarget, handAt, type HandStroke } from './hand'
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
    const data = ctx.getImageData(100, 270, 40, 30).data
    let pink = false
    for (let i = 0; i < data.length; i += 4) if (data[i] > 200 && data[i + 1] < 200 && data[i + 2] > 150) pink = true
    expect(pink).toBe(true) // pink rubber near the tip
  })
})

describe('handAt', () => {
  const strokes: HandStroke[] = [
    { start: 1000, end: 2000, path: [{ x: 0, y: 0 }, { x: 100, y: 0 }] },
    { start: 2500, end: 3000, path: [{ x: 200, y: 100 }, { x: 200, y: 200 }], tool: 'eraser' },
  ]
  const offstage = { x: 1000, y: 1000 }

  it('follows a stroke while drawing it, tip on the paper', () => {
    const hand = handAt(strokes, 1500, { offstage })
    expect(hand?.at).toEqual({ x: 50, y: 0 })
    expect(hand?.drawing).toBe(true)
    expect(hand?.lift).toBe(0)
  })

  it('lifts and glides from the end of one stroke to the start of the next', () => {
    const middle = handAt(strokes, 2250, { offstage })!
    expect(middle.drawing).toBe(false)
    expect(middle.lift).toBeCloseTo(1)
    expect(middle.at.x).toBeCloseTo(150)
    expect(middle.at.y).toBeCloseTo(50)
    expect(handAt(strokes, 2450, { offstage })!.tool).toBe('eraser')
  })

  it('comes in from offstage, leaves after the run, and is gone otherwise', () => {
    expect(handAt(strokes, 0, { offstage })).toBeNull()
    const entering = handAt(strokes, 1000 - 225, { offstage, enter: 450 })!
    expect(entering.at.x).toBeGreaterThan(0)
    expect(entering.at.x).toBeLessThan(1000)
    expect(handAt(strokes, 3200, { offstage, exit: 450 })).not.toBeNull()
    expect(handAt(strokes, 4000, { offstage, exit: 450 })).toBeNull()
  })

  it('leaves between strokes further apart than linger', () => {
    expect(handAt(strokes, 2250, { offstage, linger: 200, enter: 100, exit: 100 })).toBeNull()
  })
})

describe('drawHand lift', () => {
  it('leaves a shadow under the tip and raises the hand off it', () => {
    const down = white()
    drawHand(down, { x: 100, y: 300 })
    const up = white()
    drawHand(up, { x: 100, y: 300 }, { lift: 1 })
    expect(inked(down, 96, 296, 8, 8)).toBe(true)
    expect(inked(up, 96, 296, 8, 8)).toBe(false) // only the faint shadow is left at the point
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
      expect(skin(half)).toBe(true)
      // The rest of the line is not drawn yet (checked without the hand, whose arm hangs over it).
      const bare = drawTarget(drawnPathTarget({ path, sketch, hand: false }), { draw: 0.5 })
      expect(inked(bare, 330, 296, 200, 8)).toBe(false)

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
