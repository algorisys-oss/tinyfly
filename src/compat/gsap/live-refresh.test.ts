// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'

/**
 * Values that survive a resize: function values, invalidate(), function
 * start/end and invalidateOnRefresh, and ignoring the phone address bar.
 */

let live: LiveApi
let pending: ((t: number) => void) | null = null
let now = 0
const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
const frame = (ms: number) => {
  const cb = pending as ((t: number) => void) | null
  pending = null
  now += ms
  cb?.(now)
}
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve))
const x = (id: string) => Number(document.getElementById(id)!.style.transform.match(/translateX\(([-\d.]+)px/)?.[1] ?? 0)

let scrollY = 0
const layout = new Map<Element, { top: number; height: number }>()

beforeEach(() => {
  document.body.innerHTML = '<div class="dot" id="a"></div><div class="dot" id="b"></div><section id="panel"><div id="track"></div></section>'
  scrollY = 0
  layout.clear()
  layout.set(document.getElementById('panel')!, { top: 1000, height: 500 })
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 1000 })
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1200 })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const own = layout.get(this) ?? (this.parentElement ? layout.get(this.parentElement) : undefined) ?? { top: 0, height: 0 }
    const top = own.top - scrollY
    return { top, bottom: top + own.height, height: own.height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect
  })
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return layout.get(this)?.height ?? 0
  })
  live = createLive(new Stage({ scheduler }))
})

afterEach(() => {
  live.stage.destroy()
  vi.restoreAllMocks()
})

describe('function values', () => {
  it('are called per element with (index, element)', async () => {
    const seen: string[] = []
    live.to('.dot', {
      x: (i: number, el: Element) => (seen.push(`${i}:${el.id}`), (i + 1) * 100),
      duration: 0.1,
    })
    await flush()
    frame(0)
    frame(200)
    expect(seen).toEqual(['0:a', '1:b'])
    expect(x('a')).toBe(100)
    expect(x('b')).toBe(200)
  })

  it('leave callbacks alone', async () => {
    const onComplete = vi.fn()
    live.to('#a', { x: 10, duration: 0.05, onComplete })
    await flush()
    frame(0)
    frame(100)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(x('a')).toBe(10)
  })
})

describe('invalidate()', () => {
  it('rebuilds from the same calls, re-running function values from the original start, at the same progress', async () => {
    let distance = 100
    const tl = live.timeline({ paused: true }).to('#a', { x: () => distance, duration: 1, ease: 'none' })
    tl.progress(0.5)
    expect(x('a')).toBe(50)

    distance = 300
    tl.invalidate()
    expect(x('a')).toBe(150) // 0 → 300 at half-way, not 50 → 300
    expect(tl.timeline.tracks).toHaveLength(1)
  })
})

describe('scroll triggers on refresh', () => {
  it('re-run function ends and rebuild the animation with invalidateOnRefresh when the window resizes', async () => {
    let travel = 1000
    const tl = live
      .timeline({
        scrollTrigger: { trigger: '#panel', start: 'top top', end: () => `+=${travel}`, scrub: true, invalidateOnRefresh: true },
      })
      .to('#track', { x: () => -travel, ease: 'none', duration: 1 })
    await flush()

    scrollY = 1500
    window.dispatchEvent(new Event('scroll'))
    expect(x('track')).toBeCloseTo(-500)

    travel = 2000
    ;(window as unknown as { innerWidth: number }).innerWidth = 800
    window.dispatchEvent(new Event('resize'))
    // Half-way through 1000px of 2000 is a quarter: a quarter of -2000.
    expect(tl.scrollTrigger!.progress).toBeCloseTo(0.25)
    expect(x('track')).toBeCloseTo(-500)

    scrollY = 3000
    window.dispatchEvent(new Event('scroll'))
    expect(x('track')).toBeCloseTo(-2000)
  })

  it('ignore height-only resizes from a phone address bar, but not width changes', async () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 })
    let calls = 0
    live.timeline({
      scrollTrigger: { trigger: '#panel', start: 'top top', end: () => (calls++, '+=500'), scrub: true },
    }).to('#track', { x: 10 })
    await flush()
    const before = calls

    ;(window as unknown as { innerHeight: number }).innerHeight = 930
    window.dispatchEvent(new Event('resize'))
    expect(calls).toBe(before)

    ;(window as unknown as { innerWidth: number }).innerWidth = 700
    window.dispatchEvent(new Event('resize'))
    expect(calls).toBe(before + 1)
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 0 })
  })
})
