import { describe, it, expect, beforeAll } from 'vitest'
import { readdirSync } from 'node:fs'
import { createCanvas, Path2D } from '@napi-rs/canvas'
import { FrameRenderer } from './frame-renderer'
import type { VideoScene } from './video-scene'

/**
 * Every scene in examples/headless-video must load and draw each of its stills
 * with something on them, so the examples the docs point at cannot rot.
 */
const DIR = new URL('../../examples/headless-video/', import.meta.url)
const scenes = readdirSync(DIR).filter((file) => file.endsWith('.mjs'))

describe('examples/headless-video', () => {
  beforeAll(() => {
    ;(globalThis as { Path2D?: unknown }).Path2D ??= Path2D
  })

  it('has scenes', () => {
    expect(scenes.length).toBeGreaterThanOrEqual(3)
  })

  for (const file of scenes) {
    it(`${file} draws every still`, async () => {
      const exported = (await import(new URL(file, DIR).href)).default
      const scene: VideoScene = typeof exported === 'function' ? await exported() : exported
      const renderer = new FrameRenderer(scene, { scale: 0.25 })
      const ctx = createCanvas(renderer.width, renderer.height).getContext('2d') as unknown as CanvasRenderingContext2D
      for (const { time } of [{ time: 0 }, ...renderer.stillTimes(), { time: renderer.duration }]) {
        renderer.render(ctx, time)
        const pixels = ctx.getImageData(0, 0, renderer.width, renderer.height).data
        // More than one colour: the frame is not just the background.
        const first = pixels.slice(0, 4).join()
        let varied = false
        for (let i = 4; i < pixels.length && !varied; i += 4) varied = pixels.slice(i, i + 4).join() !== first
        expect(varied, `${file} at ${time}ms`).toBe(true)
      }
    })
  }
})
