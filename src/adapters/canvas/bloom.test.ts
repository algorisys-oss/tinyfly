import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { applyBloom, boxBlur, brightPass } from './bloom'
import { FrameRenderer } from '../../headless/frame-renderer'

const pixel = (r: number, g: number, b: number) => [r, g, b, 255]

describe('brightPass', () => {
  it('keeps what is past the threshold by its brightest channel, hue and all; drops the rest', () => {
    const out = brightPass([...pixel(255, 0, 255), ...pixel(60, 60, 60), ...pixel(255, 255, 255)], 0.5)
    // Neon magenta counts as bright (its peak channel is 1), and keeps its hue.
    expect(out[0]).toBeCloseTo(1, 6)
    expect(out[1]).toBe(0)
    expect(out[2]).toBeCloseTo(1, 6)
    expect([out[3], out[4], out[5]]).toEqual([0, 0, 0])
    expect(out[6]).toBeCloseTo(1, 6)
    // Half way past the threshold glows half as much.
    expect(brightPass(pixel(191, 191, 191), 0.5)[0]).toBeCloseTo(0.5, 2)
  })
})

describe('boxBlur', () => {
  it('spreads light without making or losing any (away from the edges)', () => {
    const w = 41
    const h = 41
    const source = new Float32Array(w * h * 3)
    source[(20 * w + 20) * 3] = 1
    const out = boxBlur(source, w, h, 6)
    let total = 0
    for (let i = 0; i < w * h; i++) total += out[i * 3]
    expect(total).toBeCloseTo(1, 4)
    expect(out[(20 * w + 20) * 3]).toBeLessThan(0.1)
    expect(out[(20 * w + 24) * 3]).toBeGreaterThan(0)
    // Symmetric.
    expect(out[(20 * w + 24) * 3]).toBeCloseTo(out[(20 * w + 16) * 3], 9)
  })
})

describe('applyBloom', () => {
  const W = 200
  const H = 120
  const scene = (bright: boolean) => {
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
    ctx.fillStyle = '#05050a'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = bright ? '#ff2bd6' : '#3a2a3a'
    ctx.fillRect(90, 50, 20, 20)
    return ctx
  }
  const at = (ctx: CanvasRenderingContext2D, x: number, y: number) => [...ctx.getImageData(x, y, 1, 1).data]

  it('makes a glow around what is bright, in its colour', () => {
    const ctx = scene(true)
    const before = at(ctx, 115, 60)
    applyBloom(ctx, { radius: 12 })
    const after = at(ctx, 115, 60)
    expect(after[0]).toBeGreaterThan(before[0] + 20)
    expect(after[2]).toBeGreaterThan(before[2] + 20)
    expect(after[1]).toBeLessThan(after[0]) // magenta glow, not white
  })

  it('leaves a picture with nothing bright alone', () => {
    const ctx = scene(false)
    const before = ctx.getImageData(0, 0, W, H).data.slice()
    applyBloom(ctx)
    const after = ctx.getImageData(0, 0, W, H).data
    expect(after.every((v, i) => v === before[i])).toBe(true)
  })

  it('blooms the same every time', () => {
    const a = scene(true)
    const b = scene(true)
    applyBloom(a)
    applyBloom(b)
    const da = a.getImageData(0, 0, W, H).data
    const db = b.getImageData(0, 0, W, H).data
    expect(da.every((v, i) => v === db[i])).toBe(true)
  })

  it('a video scene blooms with `bloom: true`', () => {
    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#00e5ff'
      ctx.fillRect(90, 50, 20, 20)
    }
    const frame = (bloom: boolean) => {
      const renderer = new FrameRenderer({ width: W, height: H, duration: 100, background: '#000000', draw, ...(bloom && { bloom: true }) })
      const ctx = createCanvas(W, H).getContext('2d') as unknown as CanvasRenderingContext2D
      renderer.render(ctx, 0)
      return at(ctx, 113, 60)
    }
    expect(frame(true)[2]).toBeGreaterThan(frame(false)[2] + 20)
  })
})
