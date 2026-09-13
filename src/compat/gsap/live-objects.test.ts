// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'

/**
 * Plain JavaScript objects as targets, and the ticker — what lets a canvas or
 * WebGL scene move on the same clock as the DOM.
 */

function manualScheduler() {
  let pending: ((timestamp: number) => void) | null = null
  let now = 0
  const scheduler: FrameScheduler = {
    request(callback) {
      pending = callback
      return 1
    },
    cancel() {
      pending = null
    },
  }
  return {
    scheduler,
    advance(stepMs: number, count = 1) {
      for (let i = 0; i < count; i++) {
        const callback = pending
        pending = null
        if (!callback) return
        now += stepMs
        callback(now)
      }
    },
    get isRunning() {
      return pending !== null
    },
  }
}

const flushMicrotasks = () => Promise.resolve()

let frames: ReturnType<typeof manualScheduler>
let live: LiveApi

beforeEach(() => {
  document.body.innerHTML = '<div id="box"></div>'
  frames = manualScheduler()
  live = createLive(new Stage({ scheduler: frames.scheduler }))
})

describe('plain-object targets', () => {
  it('tweens an object from its current values and writes them back onto it', async () => {
    const camera = { x: 10, zoom: 1, label: 'cam' }
    live.to(camera, { x: 110, zoom: 3, duration: 1, ease: 'none' })
    await flushMicrotasks()

    frames.advance(0) // first frame establishes the clock
    frames.advance(500)
    expect(camera.x).toBeCloseTo(60)
    expect(camera.zoom).toBeCloseTo(2)
    expect(camera.label).toBe('cam')

    frames.advance(600)
    expect(camera.x).toBe(110)
    expect(camera.zoom).toBe(3)
  })

  it('starts each object from its own values when several are animated together', async () => {
    const a = { y: 0 }
    const b = { y: 100 }
    live.to([a, b], { y: 50, duration: 1, ease: 'none' })
    await flushMicrotasks()
    frames.advance(0)
    frames.advance(500)
    expect(a.y).toBeCloseTo(25)
    expect(b.y).toBeCloseTo(75)
  })

  it('reads a changed object value when the next tween is built', async () => {
    const light = { intensity: 0 }
    live.to(light, { intensity: 1, duration: 0.1 })
    await flushMicrotasks()
    frames.advance(0)
    frames.advance(200)
    light.intensity = 5 // changed outside tinyfly
    live.to(light, { intensity: 10, duration: 1, ease: 'none' })
    await flushMicrotasks()
    frames.advance(0)
    frames.advance(500)
    expect(light.intensity).toBeCloseTo(7.5)
  })

  it('animates colours and staggers across objects, mixed with elements in one timeline', async () => {
    const uniforms = [{ value: 0 }, { value: 0 }]
    const tint = { color: '#000000' }
    live
      .timeline()
      .to(uniforms, { value: 1, duration: 1, ease: 'none', stagger: 0.5 })
      .to(tint, { color: '#ffffff', duration: 1, ease: 'none' }, 0)
      .to('#box', { x: 100, duration: 1, ease: 'none' }, 0)
    await flushMicrotasks()
    frames.advance(0)
    frames.advance(1000)
    expect(uniforms[0].value).toBe(1)
    expect(uniforms[1].value).toBeCloseTo(0.5)
    expect(tint.color.toLowerCase()).toMatch(/#ffffff|rgb\(255, 255, 255\)/)
    expect(document.getElementById('box')!.style.transform).toContain('100px')
  })

  it('staggers many objects evenly, with a delay counted once', async () => {
    const points = Array.from({ length: 5 }, () => ({ value: 0 }))
    live.timeline().to(points, { value: 1, duration: 1, delay: 0.5, ease: 'none', stagger: 0.25 })
    await flushMicrotasks()
    frames.advance(0)
    frames.advance(1750)
    // Starts at 0.5, 0.75, 1, 1.25, 1.5s: evenly spaced, not piling up.
    expect(points.map((point) => point.value)).toEqual([1, 1, 0.75, 0.5, 0.25].map((value) => expect.closeTo(value, 5)))
  })

  it('honours stagger amount and from for per-object tweens', async () => {
    const points = Array.from({ length: 5 }, () => ({ value: 0 }))
    live.timeline().to(points, { value: 1, duration: 1, ease: 'none', stagger: { amount: 1, from: 'center' } })
    await flushMicrotasks()
    frames.advance(0)
    frames.advance(1000)
    // Centre starts at 0, its neighbours at 0.5s, the edges at 1s.
    expect(points.map((point) => point.value)).toEqual([0, 0.5, 1, 0.5, 0].map((value) => expect.closeTo(value, 5)))
  })

  it('treats arrays as lists of targets, not as an object to animate', async () => {
    const points = [{ x: 0 }, { x: 0 }]
    live.to(points, { x: 10, duration: 0.1 })
    await flushMicrotasks()
    frames.advance(0)
    frames.advance(200)
    expect(points.map((p) => p.x)).toEqual([10, 10])
    expect((points as unknown as { x?: number }).x).toBeUndefined()
  })
})

describe('ticker', () => {
  it('runs callbacks each frame after values are applied, with GSAP-style arguments', async () => {
    const state = { x: 0 }
    const seen: [number, number, number, number][] = []
    const render = (time: number, delta: number, frame: number) => seen.push([time, delta, frame, state.x])
    live.ticker.add(render)
    live.to(state, { x: 100, duration: 1, ease: 'none' })
    await flushMicrotasks()

    frames.advance(0)
    frames.advance(250)
    frames.advance(250)
    // The callback sees this frame's value, not the previous one.
    expect(seen.at(-1)).toEqual([0.5, 250, 2, 50])
    live.ticker.remove(render)
  })

  it('keeps the loop alive with nothing playing, and stops it when the last callback goes', () => {
    let calls = 0
    const count = () => calls++
    live.ticker.add(count)
    expect(frames.isRunning).toBe(true)
    frames.advance(16)
    frames.advance(16, 3)
    expect(calls).toBe(3)

    live.ticker.remove(count)
    frames.advance(16)
    expect(frames.isRunning).toBe(false)
    expect(calls).toBe(3)
  })

  it('survives a callback removing itself mid-frame', () => {
    const calls: string[] = []
    const once = () => {
      calls.push('once')
      live.ticker.remove(once)
    }
    const always = () => calls.push('always')
    live.ticker.add(once)
    live.ticker.add(always)
    frames.advance(16)
    frames.advance(16, 2)
    expect(calls).toEqual(['once', 'always', 'always'])
  })
})
