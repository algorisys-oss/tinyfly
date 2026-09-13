// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ImageSequence } from './image-sequence'
import { createLive } from './live'
import { Stage, type FrameScheduler } from './stage'

/** Images that load only when the test says so, in any order. */
class FakeImage {
  static all: FakeImage[] = []
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  naturalWidth = 400
  naturalHeight = 200
  decoding = ''
  src = ''
  constructor() {
    FakeImage.all.push(this)
  }
  finish() {
    this.onload?.()
  }
}
const imageFor = (url: string) => FakeImage.all.find((image) => image.src === url)!
const loadedUrls = () => FakeImage.all.map((image) => image.src)

let canvas: HTMLCanvasElement
let drawn: string[]

beforeEach(() => {
  FakeImage.all = []
  vi.stubGlobal('Image', FakeImage)
  document.body.innerHTML = '<canvas id="c"></canvas>'
  canvas = document.getElementById('c') as HTMLCanvasElement
  Object.defineProperty(canvas, 'clientWidth', { configurable: true, value: 200 })
  Object.defineProperty(canvas, 'clientHeight', { configurable: true, value: 200 })
  drawn = []
  canvas.getContext = (() => ({
    clearRect: () => {},
    drawImage: (image: FakeImage, x: number, y: number, w: number, h: number) => drawn.push(`${image.src} ${x} ${y} ${w} ${h}`),
  })) as unknown as HTMLCanvasElement['getContext']
})
afterEach(() => vi.unstubAllGlobals())

const url = (i: number) => `f${i}`

describe('ImageSequence', () => {
  it('loads a few at a time, nearest the current frame first', () => {
    new ImageSequence(canvas, { frames: 20, url, concurrency: 3 })
    expect(loadedUrls()).toEqual(['f0', 'f1', 'f2'])
  })

  it('draws the frame on screen, covering the canvas, and nothing until one has loaded', () => {
    const sequence = new ImageSequence(canvas, { frames: 10, url })
    expect(drawn).toEqual([])
    imageFor('f0').finish()
    // 400×200 image covering a 200×200 canvas: scaled to 400×200, centred.
    expect(drawn.at(-1)).toBe('f0 -100 0 400 200')

    imageFor('f3').finish()
    sequence.frame = 3.2
    expect(drawn.at(-1)).toContain('f3 ')
  })

  it('shows the nearest loaded frame while the right one is still loading, then swaps it in', () => {
    const sequence = new ImageSequence(canvas, { frames: 30, url, concurrency: 2 })
    imageFor('f0').finish()
    imageFor('f1').finish()
    sequence.frame = 20
    expect(drawn.at(-1)).toContain('f1 ')
    // Once the loads already under way finish, loading moves on to the frames around 20.
    imageFor('f2').finish()
    imageFor('f3').finish()
    expect(loadedUrls().slice(-2)).toEqual(['f20', 'f21'])
    imageFor('f20').finish()
    expect(drawn.at(-1)).toContain('f20 ')
  })

  it('reports progress, and contain fit letterboxes', () => {
    const progress = vi.fn()
    new ImageSequence(canvas, { frames: 4, url, fit: 'contain', onProgress: progress })
    imageFor('f0').finish()
    expect(progress).toHaveBeenCalledWith(1, 4)
    expect(drawn.at(-1)).toBe('f0 0 50 200 100')
  })

  it('is a tween target: animating frame scrubs through the sequence', async () => {
    let pending: ((t: number) => void) | null = null
    let now = 0
    const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
    const live = createLive(new Stage({ scheduler }))
    const sequence = live.imageSequence('#c', { frames: 10, url })
    for (const image of [...FakeImage.all]) image.finish()
    for (let i = 0; i < 10; i++) imageFor(`f${i}`)?.finish()

    live.to(sequence, { frame: 9, duration: 1, ease: 'none' })
    await Promise.resolve()
    const frame = (ms: number) => {
      const cb = pending as ((t: number) => void) | null
      pending = null
      now += ms
      cb?.(now)
    }
    frame(0)
    frame(500)
    expect(sequence.frame).toBeCloseTo(4.5)
    frame(600)
    expect(sequence.frame).toBe(9)
    expect(drawn.at(-1)).toContain('f9 ')
  })
})
