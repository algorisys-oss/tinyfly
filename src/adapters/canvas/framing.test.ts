import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { drawLetterbox, drawSafeAreas, drawTransition } from './framing'
import { frameRect, frameSize, safeAreas } from '../../engine/authoring/framing'
import type { ActiveTransition } from '../../scene-3d/shots'

const pixel = (ctx: CanvasRenderingContext2D, x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3))

describe('framing', () => {
  it('fits a frame of an aspect in a canvas, sizes frames, and insets safe areas', () => {
    expect(frameRect({ width: 1280, height: 720 }, '2.39:1')).toEqual({ x: 0, y: (720 - 1280 / 2.39) / 2, width: 1280, height: 1280 / 2.39 })
    expect(frameRect({ width: 1280, height: 720 }, '9:16')).toEqual({ x: (1280 - 405) / 2, y: 0, width: 405, height: 720 })
    expect(frameSize('16:9', { width: 1280 })).toEqual({ width: 1280, height: 720 })
    expect(frameSize('9:16', { height: 1920 })).toEqual({ width: 1080, height: 1920 })
    expect(frameSize(2.39, { width: 1001 })).toEqual({ width: 1002, height: 418 })
    const areas = safeAreas({ x: 0, y: 0, width: 100, height: 50 })
    expect(areas.action.x).toBeCloseTo(5, 9)
    expect(areas.action.y).toBeCloseTo(2.5, 9)
    expect(areas.action.width).toBeCloseTo(90, 9)
    expect(areas.action.height).toBeCloseTo(45, 9)
    expect(areas.title.width).toBeCloseTo(80, 9)
  })

  it('paints bars outside the frame and dashed safe-area guides inside it', () => {
    const ctx = createCanvas(200, 100).getContext('2d') as unknown as CanvasRenderingContext2D
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 200, 100)
    const frame = drawLetterbox(ctx, { width: 200, height: 100 }, 4)
    expect(frame).toEqual({ x: 0, y: 25, width: 200, height: 50 })
    expect(pixel(ctx, 100, 5)).toEqual([0, 0, 0])
    expect(pixel(ctx, 100, 50)).toEqual([255, 255, 255])
    drawSafeAreas(ctx, frame, { color: '#ff0000' })
    const before = ctx.getImageData(0, 0, 200, 100).data
    let red = 0
    for (let i = 0; i < before.length; i += 4) if (before[i] > 200 && before[i + 1] < 100) red++
    expect(red).toBeGreaterThan(50)
  })

  it('blends two shots: a crossfade mixes, a dip covers the cut, a wipe sweeps the new shot in', () => {
    const shots = { from: { id: 'a', start: 0, end: 1, camera: 'A' }, to: { id: 'b', start: 1, end: 2, camera: 'B' } }
    const draw = (c: CanvasRenderingContext2D, camera: string) => {
      c.fillStyle = camera === 'A' ? '#ff0000' : '#0000ff'
      c.fillRect(0, 0, 100, 50)
    }
    const render = (transition: Omit<ActiveTransition, 'from' | 'to' | 'direction' | 'color'> & Partial<ActiveTransition>) => {
      const ctx = createCanvas(100, 50).getContext('2d') as unknown as CanvasRenderingContext2D
      drawTransition(ctx, { direction: 'left', color: '#000000', ...shots, ...transition }, { width: 100, height: 50, draw })
      return ctx
    }
    const fade = pixel(render({ kind: 'crossfade', progress: 0.5 }), 50, 25)
    expect(fade[0]).toBeGreaterThan(100)
    expect(fade[2]).toBeGreaterThan(100)
    expect(pixel(render({ kind: 'crossfade', progress: 0 }), 50, 25)).toEqual([255, 0, 0])
    expect(pixel(render({ kind: 'dipToBlack', progress: 0.5 }), 50, 25)).toEqual([0, 0, 0])
    expect(pixel(render({ kind: 'dipToBlack', progress: 0.9 }), 50, 25)[2]).toBeGreaterThan(150)
    const wipe = render({ kind: 'wipe', progress: 0.5, direction: 'left' })
    expect(pixel(wipe, 25, 25)).toEqual([0, 0, 255])
    expect(pixel(wipe, 75, 25)).toEqual([255, 0, 0])
    const up = render({ kind: 'wipe', progress: 0.5, direction: 'up' })
    expect(pixel(up, 50, 40)).toEqual([0, 0, 255])
    expect(pixel(up, 50, 10)).toEqual([255, 0, 0])
  })
})
