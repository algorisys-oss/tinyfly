import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { clipErased, erasable, scrubPath, withErased } from './erase'
import { partialPath, pathLength, pointAlong } from '../adapters/canvas/polyline'
import type { CustomTarget } from '../adapters/canvas'

const context = () => createCanvas(200, 100).getContext('2d') as unknown as CanvasRenderingContext2D

/** Whether the pixel at (x, y) is dark (ink on a white canvas). */
function inkAt(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
  const [r] = ctx.getImageData(x, y, 1, 1).data
  return r < 128
}

function whiteCanvas() {
  const ctx = context()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 200, 100)
  ctx.fillStyle = '#000000'
  return ctx
}

describe('paths', () => {
  const line = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }]

  it('measures and cuts a polyline by length', () => {
    expect(pathLength(line)).toBe(150)
    expect(partialPath(line, 0)).toEqual([{ x: 0, y: 0 }])
    expect(partialPath(line, 1)).toEqual(line)
    expect(partialPath(line, 0.5)).toEqual([{ x: 0, y: 0 }, { x: 75, y: 0 }])
    expect(partialPath(line, 0.8)).toEqual([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 20 }])
    expect(pointAlong(line, 0.8)).toEqual({ x: 100, y: 20 })
    expect(partialPath(line, 2)).toEqual(line)
  })

  it('scrubs back and forth across a box, stepping down', () => {
    expect(scrubPath(10, 20, 50, 30, 3)).toEqual([
      { x: 10, y: 20 },
      { x: 60, y: 30 },
      { x: 10, y: 40 },
      { x: 60, y: 50 },
    ])
  })
})

describe('clipErased', () => {
  const fillAll = (ctx: CanvasRenderingContext2D) => ctx.fillRect(0, 0, 200, 100)
  const path = [{ x: 20, y: 50 }, { x: 180, y: 50 }]

  it('leaves the swath the eraser has covered, and only that, undrawn', () => {
    const ctx = whiteCanvas()
    withErased(ctx, path, 20, 0.5, () => fillAll(ctx))
    expect(inkAt(ctx, 50, 50)).toBe(false) // on the path, already rubbed
    expect(inkAt(ctx, 15, 50)).toBe(false) // the round end of the swath
    expect(inkAt(ctx, 50, 75)).toBe(true) // beside the swath
    expect(inkAt(ctx, 150, 50)).toBe(true) // on the path, not reached yet
  })

  it('erases overlapping passes as one swath (no inked overlaps)', () => {
    const ctx = whiteCanvas()
    withErased(ctx, scrubPath(40, 30, 120, 40, 4), 24, 1, () => fillAll(ctx))
    for (const [x, y] of [[40, 30], [100, 50], [160, 50], [100, 70]]) expect(inkAt(ctx, x, y), `${x},${y}`).toBe(false)
    expect(inkAt(ctx, 100, 5)).toBe(true)
  })

  it('erases nothing at progress 0', () => {
    const ctx = whiteCanvas()
    ctx.save()
    clipErased(ctx, path, 20, 0)
    fillAll(ctx)
    ctx.restore()
    expect(inkAt(ctx, 20, 50)).toBe(true)
  })
})

describe('erasable', () => {
  const block: CustomTarget = {
    type: 'custom',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    props: { size: 1 },
    draw(ctx) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 200, 100)
    },
  }

  it('adds an erase prop and keeps the target’s own props', () => {
    const target = erasable(block, { path: [{ x: 0, y: 0 }, { x: 10, y: 0 }] })
    expect(target.props).toEqual({ size: 1, erase: 0 })
  })

  it('erases the target along the path as erase grows', () => {
    const target = erasable(block, { path: [{ x: 20, y: 50 }, { x: 180, y: 50 }], width: 20, eraser: false })
    const ctx = whiteCanvas()
    target.draw(ctx, { ...target, props: { ...target.props, erase: 0.5 } }, 0)
    expect(inkAt(ctx, 50, 50)).toBe(false)
    expect(inkAt(ctx, 150, 50)).toBe(true)
    expect(inkAt(ctx, 50, 10)).toBe(true)
  })

  it('draws the eraser while rubbing, and not once done', () => {
    const target = erasable(block, { path: [{ x: 20, y: 50 }, { x: 180, y: 50 }], width: 20 })
    const rubbing = whiteCanvas()
    target.draw(rubbing, { ...target, props: { ...target.props, erase: 0.5 } }, 0)
    // The eraser's tip sits at the middle of the path; its rubber leans up and right from there.
    const [r, g, b] = rubbing.getImageData(112, 41, 1, 1).data
    expect(r > 200 && g < 200 && b > 150).toBe(true) // pink rubber
    const done = whiteCanvas()
    target.draw(done, { ...target, props: { ...target.props, erase: 1 } }, 0)
    expect(done.getImageData(112, 41, 1, 1).data[0]).toBe(255) // erased to the paper, no eraser
  })
})
