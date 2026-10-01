import { describe, it, expect, beforeAll } from 'vitest'
import { createCanvas, Path2D } from '@napi-rs/canvas'
import { CanvasAdapter, type CanvasTarget } from './canvas-adapter'
import { pathOutline, rectOutline } from './outline'

beforeAll(() => {
  ;(globalThis as { Path2D?: unknown }).Path2D ??= Path2D
})

/** Render one target at `time` with optional state values, on white. */
function render(target: CanvasTarget, values: Record<string, number> = {}, time = 0) {
  const adapter = new CanvasAdapter()
  adapter.registerTarget('shape', target)
  adapter.applyState({
    currentTime: time,
    values: new Map([['shape', new Map(Object.entries(values))]]),
  } as never)
  const ctx = createCanvas(200, 200).getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 200, 200)
  adapter.render(ctx)
  return ctx
}

const pixels = (ctx: CanvasRenderingContext2D) => Buffer.from(ctx.getImageData(0, 0, 200, 200).data).toString('base64')

/** Whether any pixel in the box is dark. */
function inked(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): boolean {
  const data = ctx.getImageData(x, y, w, h).data
  for (let i = 0; i < data.length; i += 4) if (data[i] < 120 && data[i + 1] < 120 && data[i + 2] < 120) return true
  return false
}

/** Whether the pixel is the red fill. */
const filled = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
  return r > 200 && g < 80 && b < 80
}

const rect: CanvasTarget = {
  type: 'rect',
  x: 40,
  y: 40,
  width: 120,
  height: 120,
  fillStyle: '#ff0000',
  strokeStyle: '#000000',
  lineWidth: 4,
}

describe('outlines', () => {
  it('draws a polygon as one run of straight segments', () => {
    const strokes = rectOutline(0, 0, 100, 50)
    expect(strokes).toHaveLength(1)
    expect(strokes[0].kind).toBe('line')
    expect(strokes[0].points).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
      { x: 0, y: 0 },
    ])
    expect(strokes[0].length).toBe(300)
  })

  it('splits curves out of a path, and rounded corners into curves', () => {
    const kinds = pathOutline('M0,0 L50,0 C80,0 100,20 100,50 L100,100').map((s) => s.kind)
    expect(kinds).toEqual(['line', 'curve', 'line'])
    expect(rectOutline(0, 0, 100, 100, 10).filter((s) => s.kind === 'curve')).toHaveLength(4)
  })
})

describe('sketched and drawn-on canvas shapes', () => {
  it('draws exactly as before without sketch or drawOn', () => {
    expect(pixels(render(rect))).toBe(pixels(render({ ...rect, drawOn: 1 })))
  })

  it('draws a rect on: part of the outline, no fill until it is complete', () => {
    const half = render(rect, { drawOn: 0.5 })
    expect(inked(half, 60, 36, 80, 8)).toBe(true) // top edge
    expect(inked(half, 156, 60, 8, 80)).toBe(true) // right edge
    expect(inked(half, 36, 60, 8, 80)).toBe(false) // left edge, not reached
    expect(filled(half, 100, 100)).toBe(false)
    const done = render(rect, { drawOn: 1 })
    expect(inked(done, 36, 60, 8, 80)).toBe(true)
    expect(filled(done, 100, 100)).toBe(true)
  })

  it('draws a circle on from the top, clockwise', () => {
    const circle: CanvasTarget = { type: 'circle', x: 100, y: 100, radius: 60, strokeStyle: '#000000', lineWidth: 4 }
    const quarter = render(circle, { drawOn: 0.3 })
    expect(inked(quarter, 96, 36, 8, 8)).toBe(true) // the top
    expect(inked(quarter, 150, 90, 14, 20)).toBe(true) // the right
    expect(inked(quarter, 36, 90, 14, 20)).toBe(false) // the left
    expect(inked(render(circle, { drawOn: 0 }), 0, 0, 200, 200)).toBe(false)
  })

  it('draws lines and paths on', () => {
    const line: CanvasTarget = { type: 'line', x: 20, y: 100, x2: 180, y2: 100, strokeStyle: '#000000', lineWidth: 4 }
    const half = render(line, { drawOn: 0.5 })
    expect(inked(half, 20, 95, 50, 10)).toBe(true)
    expect(inked(half, 130, 95, 50, 10)).toBe(false)
    const path: CanvasTarget = { type: 'path', x: 0, y: 0, d: 'M20,50 C60,0 140,0 180,50', strokeStyle: '#000000', lineWidth: 4 }
    const start = render(path, { drawOn: 0.3 })
    expect(inked(start, 15, 30, 40, 25)).toBe(true)
    expect(inked(start, 150, 25, 35, 30)).toBe(false)
  })

  it('sketches the outline, keeps the fill, and boils deterministically', () => {
    const sketched = { ...rect, sketch: { roughness: 3 } }
    const frame = render(sketched, {}, 0)
    expect(pixels(frame)).not.toBe(pixels(render(rect)))
    expect(filled(frame, 100, 100)).toBe(true)
    expect(inked(frame, 60, 34, 80, 12)).toBe(true)
    expect(pixels(render(sketched, {}, 0))).toBe(pixels(frame))
    expect(pixels(render(sketched, {}, 60))).toBe(pixels(frame)) // same boil frame
    expect(pixels(render(sketched, {}, 400))).not.toBe(pixels(frame)) // a later one
  })

  it('sketches circles, lines and paths too, and draws them on', () => {
    const shapes: CanvasTarget[] = [
      { type: 'circle', x: 100, y: 100, radius: 60, strokeStyle: '#000000', lineWidth: 4, sketch: {} },
      { type: 'line', x: 20, y: 100, x2: 180, y2: 100, strokeStyle: '#000000', lineWidth: 4, sketch: {} },
      { type: 'path', x: 0, y: 0, d: 'M20,150 L100,40 L180,150 Z', strokeStyle: '#000000', lineWidth: 4, sketch: {} },
    ]
    for (const shape of shapes) {
      expect(inked(render(shape), 0, 0, 200, 200), shape.type).toBe(true)
      expect(inked(render(shape, { drawOn: 0 }), 0, 0, 200, 200), shape.type).toBe(false)
      expect(pixels(render(shape, { drawOn: 0.4 })), shape.type).not.toBe(pixels(render(shape)))
    }
  })
})
