import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { boilFrame, sketchPen, type SketchStyle } from '../adapters/canvas/sketch'
import { drawStickFigure, REST_POSE } from './stick-figure'

const context = () => createCanvas(200, 200).getContext('2d') as unknown as CanvasRenderingContext2D

/** Draw with a fresh canvas and return its pixels, to compare frames. */
function pixels(draw: (ctx: CanvasRenderingContext2D) => void): string {
  const ctx = context()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 200, 200)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 3
  draw(ctx)
  return Buffer.from(ctx.getImageData(0, 0, 200, 200).data).toString('base64')
}

const square = (style: SketchStyle, time: number) => (ctx: CanvasRenderingContext2D) => {
  const pen = sketchPen(ctx, style, time)
  pen.line([{ x: 40, y: 40 }, { x: 160, y: 40 }, { x: 160, y: 160 }])
  pen.circle(90, 110, 30)
}

describe('boilFrame', () => {
  it('counts redraws per second, and holds at 0 without boil', () => {
    expect(boilFrame(0, 8)).toBe(0)
    expect(boilFrame(124, 8)).toBe(0)
    expect(boilFrame(125, 8)).toBe(1)
    expect(boilFrame(1000, 8)).toBe(8)
    expect(boilFrame(5000, 0)).toBe(0)
    expect(boilFrame(-50, 8)).toBe(0)
  })
})

describe('sketchPen', () => {
  it('draws the same lines for the same time: frames are deterministic', () => {
    expect(pixels(square({}, 1300))).toBe(pixels(square({}, 1300)))
  })

  it('keeps its wobble within a boil frame and changes it on the next', () => {
    expect(pixels(square({ boil: 8 }, 0))).toBe(pixels(square({ boil: 8 }, 120)))
    expect(pixels(square({ boil: 8 }, 0))).not.toBe(pixels(square({ boil: 8 }, 130)))
  })

  it('holds still with boil 0', () => {
    expect(pixels(square({ boil: 0 }, 0))).toBe(pixels(square({ boil: 0 }, 9000)))
  })

  it('wobbles differently for a different seed', () => {
    expect(pixels(square({ seed: 1 }, 0))).not.toBe(pixels(square({ seed: 2 }, 0)))
  })

  it('restores the line width and alpha after its extra passes', () => {
    const ctx = context()
    ctx.lineWidth = 4
    ctx.globalAlpha = 0.8
    sketchPen(ctx, { passes: 3 }, 0).line([{ x: 0, y: 0 }, { x: 100, y: 100 }])
    expect(ctx.lineWidth).toBe(4)
    expect(ctx.globalAlpha).toBeCloseTo(0.8)
  })
})

describe('a sketched stick figure', () => {
  const figure = (time: number, sketch?: SketchStyle) => (ctx: CanvasRenderingContext2D) => {
    ctx.translate(100, 190)
    drawStickFigure(ctx, REST_POSE, { height: 170, color: '#000000', sketch }, time)
  }

  it('boils over time, while a clean one ignores the time', () => {
    expect(pixels(figure(0))).toBe(pixels(figure(500)))
    expect(pixels(figure(0, {}))).not.toBe(pixels(figure(500, {})))
    expect(pixels(figure(0, {}))).not.toBe(pixels(figure(0)))
  })
})

describe('drawing on', () => {
  const inked = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const data = ctx.getImageData(x, y, w, h).data
    for (let i = 0; i < data.length; i += 4) if (data[i] < 128) return true
    return false
  }
  const across = [{ x: 20, y: 100 }, { x: 100, y: 100 }, { x: 180, y: 100 }]

  it('draws a stroke only as far as its progress', () => {
    for (const draw of [
      (pen: ReturnType<typeof sketchPen>, t: number) => pen.line(across, t),
      (pen: ReturnType<typeof sketchPen>, t: number) => pen.curve(across, t),
    ]) {
      const half = context()
      half.fillStyle = '#ffffff'
      half.fillRect(0, 0, 200, 200)
      half.lineWidth = 3
      draw(sketchPen(half, {}, 0), 0.4)
      expect(inked(half, 20, 85, 40, 30)).toBe(true)
      expect(inked(half, 120, 85, 60, 30)).toBe(false)
    }
  })

  it('draws nothing at 0, and the whole stroke at 1', () => {
    const line = (t?: number) => (ctx: CanvasRenderingContext2D) => sketchPen(ctx, {}, 0).line(across, t)
    expect(pixels(line(0))).toBe(pixels(() => {}))
    expect(pixels(line(1))).toBe(pixels(line()))
    const circle = (t?: number) => (ctx: CanvasRenderingContext2D) => sketchPen(ctx, {}, 0).circle(100, 100, 40, t)
    expect(pixels(circle(1))).toBe(pixels(circle()))
    expect(pixels(circle(0.5))).not.toBe(pixels(circle()))
  })

  it('keeps each stroke’s wobble its own: a stroke drawn partway does not move the next', () => {
    const scene = (first: number) => (ctx: CanvasRenderingContext2D) => {
      const pen = sketchPen(ctx, {}, 0)
      pen.line([{ x: 20, y: 40 }, { x: 60, y: 40 }, { x: 100, y: 40 }], first)
      pen.line([{ x: 20, y: 150 }, { x: 180, y: 150 }])
    }
    const lower = (draw: (ctx: CanvasRenderingContext2D) => void) => {
      const ctx = context()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 200, 200)
      ctx.lineWidth = 3
      draw(ctx)
      return Array.from(ctx.getImageData(0, 120, 200, 60).data).join()
    }
    expect(lower(scene(0.3))).toBe(lower(scene(1)))
  })
})
