// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'
import { hasKeyframes, type Track } from '../../engine'

/**
 * The live facade adds a runtime on top of the compiler: selector resolution,
 * a shared frame loop, and composition of concurrent animations. These tests
 * drive the stage with a manual scheduler so every frame is explicit.
 */

/** A scheduler that runs frames only when the test says so. */
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
    /** Run `count` frames, `stepMs` apart. */
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

/** Let queued microtasks (autoplay) run. */
const flushMicrotasks = () => Promise.resolve()

let frames: ReturnType<typeof manualScheduler>
let live: LiveApi

beforeEach(() => {
  document.body.innerHTML = `
    <div id="box"></div>
    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
  `
  frames = manualScheduler()
  live = createLive(new Stage({ scheduler: frames.scheduler }))
})

const box = () => document.getElementById('box') as HTMLElement

/** Start the loop, then advance: the first frame only records a timestamp. */
function run(ms: number, stepMs = 16) {
  frames.advance(stepMs)
  frames.advance(stepMs, Math.ceil(ms / stepMs))
}

describe('live.to()', () => {
  it('plays on the element without any further calls', async () => {
    live.to('#box', { x: 100, duration: 0.1, ease: 'linear' })
    await flushMicrotasks()

    run(200)
    expect(box().style.transform).toBe('translateX(100px)')
  })

  it('stops the frame loop once every animation has finished', async () => {
    live.to('#box', { x: 100, duration: 0.1 })
    await flushMicrotasks()

    run(200)
    expect(frames.isRunning).toBe(false)
  })

  it('does not start when paused', async () => {
    const tween = live.to('#box', { x: 100, duration: 0.1, paused: true })
    await flushMicrotasks()

    expect(frames.isRunning).toBe(false)
    tween.play()
    run(200)
    expect(box().style.transform).toBe('translateX(100px)')
  })

  it('calls onStart and onComplete from the vars', async () => {
    const onStart = vi.fn()
    const onComplete = vi.fn()
    live.to('#box', { x: 100, duration: 0.1, onStart, onComplete })
    await flushMicrotasks()

    expect(onStart).toHaveBeenCalledTimes(1)
    run(200)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('animates every element a selector matches, as one staggered track', () => {
    const tween = live.to('.dot', { opacity: 0, duration: 0.2, stagger: 0.1, paused: true })
    const [track] = tween.timeline.tracks.filter(hasKeyframes) as Track[]
    expect(track.targets).toHaveLength(3)
  })

  it('accepts elements and node lists', () => {
    const a = live.to(box(), { x: 10, paused: true })
    const b = live.to(document.querySelectorAll('.dot'), { x: 10, paused: true })
    expect(a.timeline.tracks).toHaveLength(1)
    expect((b.timeline.tracks[0] as Track).targets).toHaveLength(3)
  })

  it('warns and builds nothing when the selector matches no element', () => {
    const onWarning = vi.fn()
    const tl = live.timeline({ paused: true, onWarning })
    tl.to('.missing', { x: 10 })
    expect(tl.timeline.tracks).toHaveLength(0)
    expect(onWarning).toHaveBeenCalledWith(expect.stringContaining('.missing'))
  })
})

describe('composition on one element', () => {
  it('composes transforms from separate tweens instead of overwriting', async () => {
    live.to('#box', { x: 100, duration: 0.1, ease: 'linear' })
    live.to('#box', { rotate: 90, duration: 0.1, ease: 'linear' })
    await flushMicrotasks()

    run(200)
    expect(box().style.transform).toContain('translateX(100px)')
    expect(box().style.transform).toContain('rotate(90deg)')
  })

  it('keeps a finished tween\'s value when a later tween starts', async () => {
    live.to('#box', { x: 100, duration: 0.1 })
    await flushMicrotasks()
    run(200)

    live.to('#box', { rotate: 45, duration: 0.1 })
    await flushMicrotasks()
    run(200)

    expect(box().style.transform).toContain('translateX(100px)')
    expect(box().style.transform).toContain('rotate(45deg)')
  })

  it('starts a new tween from the value an earlier one left', async () => {
    live.to('#box', { x: 100, duration: 0.1 })
    await flushMicrotasks()
    run(200)

    const next = live.to('#box', { x: 300, duration: 0.1, paused: true })
    const [track] = next.timeline.tracks.filter(hasKeyframes) as Track[]
    expect(track.keyframes[0].value).toBe(100)
  })
})

describe('live timelines', () => {
  it('includes tweens chained synchronously before autoplay', async () => {
    const tl = live
      .timeline()
      .to('#box', { x: 100, duration: 0.1 })
      .to('#box', { y: 50, duration: 0.1 })
    await flushMicrotasks()

    expect(tl.duration()).toBeCloseTo(0.2)
    run(400)
    expect(box().style.transform).toContain('translateY(50px)')
  })

  it('applies a seek immediately and cancels autoplay', async () => {
    const tl = live.timeline().fromTo('#box', { x: 0 }, { x: 200, duration: 1, ease: 'linear' })
    tl.seek(0.5)
    await flushMicrotasks()

    expect(box().style.transform).toBe('translateX(100px)')
    expect(frames.isRunning).toBe(false)
  })

  it('pauses and resumes', async () => {
    const tl = live.timeline().fromTo('#box', { x: 0 }, { x: 200, duration: 1, ease: 'linear' })
    await flushMicrotasks()

    run(100)
    tl.pause()
    const pausedAt = box().style.transform
    frames.advance(16, 10)
    expect(box().style.transform).toBe(pausedAt)

    tl.resume()
    run(2000)
    expect(box().style.transform).toBe('translateX(200px)')
  })

  it('reverses a finished timeline back to the start', async () => {
    const tl = live.timeline().fromTo('#box', { x: 0 }, { x: 200, duration: 0.1, ease: 'linear' })
    await flushMicrotasks()
    run(200)

    tl.reverse()
    run(200)
    expect(box().style.transform).toBe('translateX(0px)')
  })

  it('applies set() immediately and lets the loop stop', async () => {
    live.set('#box', { x: 42 })
    await flushMicrotasks()

    expect(box().style.transform).toBe('translateX(42px)')
    run(32)
    expect(frames.isRunning).toBe(false)
  })

  it('compiles to the same plain JSON as the tf facade', () => {
    const tl = live.timeline({ paused: true }).fromTo('#box', { x: 0 }, { x: 10, duration: 1 })
    const json = JSON.parse(JSON.stringify(tl.toDefinition()))
    expect(json.tracks[0]).toMatchObject({ target: '#box', property: 'x' })
  })

  it('flattens a child timeline without killing its tracks', async () => {
    const child = live.timeline().to('#box', { x: 100, duration: 0.1 })
    const parent = live.timeline().add(child)
    await flushMicrotasks()

    expect(parent.timeline.tracks).toHaveLength(1)
    expect(child.isActive()).toBe(false)
  })
})

describe('stage warnings', () => {
  const warningLive = () => {
    const warnings: string[] = []
    const api = createLive(new Stage({ scheduler: manualScheduler().scheduler, onWarning: (message) => warnings.push(message) }))
    return { api, warnings }
  }

  it('reports a tween whose selector matches nothing', () => {
    const { api, warnings } = warningLive()
    api.to('.missing', { x: 10, duration: 1 })
    expect(warnings).toEqual(['gsap-compat: no elements found for target ".missing"'])
  })

  it('reports drawSVG on an element that is not a shape', () => {
    const { api, warnings } = warningLive()
    api.fromTo('#box', { drawSVG: 0 }, { drawSVG: true, duration: 1 })
    expect(warnings.some((message) => message.includes('drawSVG needs an SVG shape'))).toBe(true)
  })

  it('reports a spring on a colour, which eases instead', () => {
    const { api, warnings } = warningLive()
    const tl = api.fromTo('#box', { backgroundColor: '#000000' }, { backgroundColor: '#ffffff', spring: 'bouncy' })
    expect(warnings).toEqual(['gsap-compat: spring works on numbers, so "backgroundColor" on "#box" eases instead'])
    expect(tl.toDefinition().tracks.some((track) => 'keyframes' in track)).toBe(true)
  })

  it("lets a timeline's own onWarning take precedence", () => {
    const { api, warnings } = warningLive()
    const own: string[] = []
    api.timeline({ onWarning: (message) => own.push(message) }).to('.missing', { x: 10, duration: 1 })
    expect(own).toHaveLength(1)
    expect(warnings).toEqual([])
  })
})

describe('Stage.destroy()', () => {
  it('stops running animations and the loop', async () => {
    const tl = live.timeline({ repeat: -1 }).to('#box', { x: 100, duration: 0.5 })
    await flushMicrotasks()
    run(100)

    live.stage.destroy()
    expect(frames.isRunning).toBe(false)
    expect(tl.isActive()).toBe(false)
  })

  it('ignores an autoplay that was already queued', async () => {
    live.to('#box', { x: 100, duration: 0.5, repeat: -1 })
    live.stage.destroy()
    await flushMicrotasks()

    expect(frames.isRunning).toBe(false)
    expect(box().style.transform).toBe('')
  })
})
