import { describe, it, expect } from 'vitest'
import { mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CLOSED_DB, loopReport, psnr } from './loop-check'
import { checkLoop, renderStills } from './node-video'
import type { VideoScene } from './video-scene'

const image = (value: number, size = 16) => {
  const data = new Uint8ClampedArray(size * 4)
  for (let i = 0; i < data.length; i++) data[i] = i % 4 === 3 ? 255 : value
  return data
}

describe('psnr', () => {
  it('is infinite for identical images and falls as they differ', () => {
    expect(psnr(image(100), image(100))).toBe(Infinity)
    expect(psnr(image(100), image(110))).toBeGreaterThan(psnr(image(100), image(140)))
    // Uniform difference d: 10·log10(255² / d²).
    expect(psnr(image(0), image(255))).toBeCloseTo(0, 9)
    expect(() => psnr(image(0, 4), image(0, 8))).toThrow(/size/)
  })
})

describe('loopReport', () => {
  it('a loop that closes passes, whatever its seam', () => {
    const report = loopReport({ first: image(10), second: image(20), beforeLast: image(200), last: image(240), wrapped: image(10) })
    expect(report.closure).toBe(Infinity)
    expect(report.loops).toBe(true)
    expect(report.verdict).toMatch(/closes/)
  })

  it('a seam like an ordinary step passes; a jump fails', () => {
    const smooth = loopReport({ first: image(100), second: image(104), beforeLast: image(92), last: image(96), wrapped: image(110) })
    expect(smooth.loops).toBe(true)
    expect(smooth.verdict).toMatch(/seamless/)
    const cut = loopReport({ first: image(0), second: image(4), beforeLast: image(244), last: image(248), wrapped: image(252) })
    expect(cut.loops).toBe(false)
    expect(cut.verdict).toMatch(/does not loop/)
  })
})

const dot = (x: (time: number) => number, duration = 2000): VideoScene => ({
  width: 120,
  height: 80,
  fps: 20,
  duration,
  background: '#ffffff',
  draw(ctx, { time }) {
    ctx.fillStyle = '#e11d48'
    ctx.beginPath()
    ctx.arc(x(time), 40, 12, 0, Math.PI * 2)
    ctx.fill()
  },
})

describe('checkLoop', () => {
  it('a motion that repeats over the duration loops exactly', async () => {
    const report = await checkLoop(dot((t) => 60 + 40 * Math.sin((2 * Math.PI * t) / 2000)))
    expect(report.closure).toBeGreaterThanOrEqual(CLOSED_DB)
    expect(report.loops).toBe(true)
  })

  it('a dot that slides across once does not loop', async () => {
    const report = await checkLoop(dot((t) => 15 + (90 * t) / 2000))
    expect(report.loops).toBe(false)
  })

  it('stills at chosen times', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinyfly-frames-'))
    const files = await renderStills(dot((t) => 60 + t / 100), { dir, times: [{ id: 'frame-0', time: 0 }, { id: 'frame-10', time: 500 }] })
    expect(files).toHaveLength(2)
    expect(readdirSync(dir).sort()).toEqual(['0-frame-0.png', '1-frame-10.png'])
  })
})
