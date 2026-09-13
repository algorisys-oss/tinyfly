// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'

/**
 * `scrollTrigger` on live timelines and tweens. Layout is faked: each element
 * has a document y, and its viewport rect follows `scrollY`.
 */

let scrollY = 0
const layout = new Map<Element, { top: number; height: number; left?: number; width?: number }>()
let pending: ((t: number) => void) | null = null
let now = 0
const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
const frame = (ms = 16) => {
  const cb = pending
  pending = null
  now += ms
  cb?.(now)
}

let live: LiveApi
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve))

function scrollTo(y: number) {
  scrollY = y
  window.dispatchEvent(new Event('scroll'))
}

beforeEach(() => {
  document.body.innerHTML = '<section id="panel"><div id="box"></div></section><div id="card"></div>'
  layout.clear()
  layout.set(document.getElementById('panel')!, { top: 1000, height: 500 })
  layout.set(document.getElementById('box')!, { top: 1000, height: 100 })
  layout.set(document.getElementById('card')!, { top: 3000, height: 200 })
  scrollY = 0
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const own = layout.get(this) ?? (this.parentElement ? layout.get(this.parentElement) : undefined) ?? { top: 0, height: 0 }
    const top = own.top - scrollY
    const left = own.left ?? 0
    const width = own.width ?? 0
    return { top, bottom: top + own.height, height: own.height, left, right: left + width, width, x: left, y: top, toJSON: () => ({}) } as DOMRect
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

const x = (id: string) => {
  const match = document.getElementById(id)!.style.transform.match(/translate(?:X|3d)?\(([-\d.]+)px/)
  return match ? Number(match[1]) : 0
}

describe('scrollTrigger with scrub', () => {
  it('ties the timeline to scroll position and never autoplays', async () => {
    const tl = live
      .timeline({ scrollTrigger: { trigger: '#panel', start: 'top top', end: '+=1000', scrub: true } })
      .to('#box', { x: 200, duration: 1, ease: 'none' })
    await flush()
    frame()
    frame(500)
    expect(x('box')).toBe(0)
    expect(tl.isActive()).toBe(false)

    scrollTo(1500)
    expect(x('box')).toBeCloseTo(100)
    scrollTo(2500)
    expect(x('box')).toBeCloseTo(200)
    scrollTo(1250)
    expect(x('box')).toBeCloseTo(50)
  })

  it('pins the trigger for the range, and kill() removes the pin', async () => {
    const tl = live
      .timeline({ scrollTrigger: { trigger: '#panel', start: 'top top', end: '+=2000', scrub: true, pin: true } })
      .to('#box', { x: 100 })
    await flush()
    const panel = document.getElementById('panel')!
    expect(panel.parentElement?.className).toBe('pin-spacer')
    expect(panel.style.position).toBe('sticky')
    expect(tl.scrollTrigger).toBeDefined()

    tl.kill()
    expect(panel.parentElement).toBe(document.body)
  })

  it('defaults the trigger to the first element animated', async () => {
    live.to('#card', { x: 100, ease: 'none', scrollTrigger: { start: 'top top', end: '+=100', scrub: true } })
    await flush()
    scrollTo(3050)
    expect(x('card')).toBeCloseTo(50)
  })
})

describe('scrollTrigger with toggleActions', () => {
  it('shows the starting state of a from() reveal until the trigger is reached, then plays', async () => {
    live.from('#card', { x: -80, duration: 0.5, scrollTrigger: { start: 'top 80%' } })
    await flush()
    expect(x('card')).toBe(-80)

    scrollTo(2300) // card top reaches 80% of the viewport at 2200
    frame()
    frame(600)
    expect(x('card')).toBe(0)
  })

  it("runs each edge's action: 'play none none reverse'", async () => {
    const tl = live.to('#card', { x: 100, duration: 0.2, scrollTrigger: { start: 'top bottom', end: 'bottom top', toggleActions: 'play none none reverse' } })
    await flush()
    scrollTo(2500)
    frame()
    frame(300)
    expect(x('card')).toBe(100)

    scrollTo(0) // back above the start: leave back → reverse
    frame()
    frame(300)
    expect(x('card')).toBe(0)
    expect(tl.progress()).toBe(0)

    // Entering again plays forward from the start — no jump to the end.
    scrollTo(2500)
    frame()
    frame(100)
    expect(x('card')).toBeGreaterThan(0)
    expect(x('card')).toBeLessThan(100)
    frame(200)
    expect(x('card')).toBe(100)
  })

  it('once: stops watching after the first enter', async () => {
    const onEnter = vi.fn()
    live.to('#card', { x: 100, duration: 0.1, scrollTrigger: { start: 'top bottom', once: true, onEnter } })
    await flush()
    scrollTo(2500)
    await flush()
    scrollTo(0)
    scrollTo(2500)
    expect(onEnter).toHaveBeenCalledTimes(1)
  })
})

describe('live.scrollTrigger', () => {
  it('reports progress, velocity and direction with no animation attached', async () => {
    const updates: { progress: number; direction: number }[] = []
    const trigger = live.scrollTrigger({ trigger: '#panel', start: 'top top', end: '+=1000', onUpdate: (self) => updates.push(self) })
    scrollTo(1500)
    scrollTo(1200)
    expect(updates.at(-2)?.progress).toBeCloseTo(0.5)
    expect(updates.at(-1)?.direction).toBe(-1)
    trigger?.destroy()
  })

  it('is removed, pin included, when the stage is destroyed', async () => {
    live.timeline({ scrollTrigger: { trigger: '#panel', start: 'top top', end: '+=500', scrub: true, pin: true } }).to('#box', { x: 10 })
    await flush()
    expect(document.querySelector('.pin-spacer')).not.toBeNull()
    live.stage.destroy()
    expect(document.querySelector('.pin-spacer')).toBeNull()
  })

  it('warns and returns nothing when the trigger is missing', () => {
    const warn = vi.fn()
    const tl = live.timeline({ scrollTrigger: { trigger: '#nope' }, onWarning: warn })
    return flush().then(() => {
      expect(tl.scrollTrigger).toBeUndefined()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('#nope'))
    })
  })
})

describe('snap with labels, and containerAnimation', () => {
  it("snap: 'labels' settles on the nearest label after scrolling stops", async () => {
    vi.useFakeTimers()
    let clock = 0
    vi.spyOn(performance, 'now').mockImplementation(() => clock)
    const scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo

    live
      .timeline({ scrollTrigger: { trigger: '#panel', start: 'top top', end: '+=1000', scrub: true, snap: { snapTo: 'labels', duration: 0 } } })
      .addLabel('a')
      .to('#box', { x: 100, duration: 1 })
      .addLabel('b')
      .to('#box', { x: 200, duration: 3 })
      .addLabel('c')
    await Promise.resolve()

    clock = 16
    scrollY = 1200
    window.dispatchEvent(new Event('scroll'))
    clock = 32
    scrollY = 1210 // progress 0.21: label b is at 0.25
    window.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(200)
    expect(scrollToSpy).toHaveBeenLastCalledWith({ top: 1250, behavior: 'instant' })
    vi.useRealTimers()
  })

  it('containerAnimation: a horizontal trigger fires when the moving row brings it into view', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 })
    document.body.innerHTML = '<section id="h"><div id="row"><div id="item"></div></div></section>'
    layout.set(document.getElementById('h')!, { top: 1000, height: 500 })
    layout.set(document.getElementById('item')!, { top: 1000, height: 100, left: 1500, width: 100 })

    const row = live
      .timeline({ scrollTrigger: { trigger: '#h', start: 'top top', end: '+=2000', scrub: true } })
      .to('#row', { x: -2000, ease: 'none', duration: 1 })
    await Promise.resolve()

    const onEnter = vi.fn()
    live.to('#item', { opacity: 0.5, duration: 0.1, scrollTrigger: { trigger: '#item', containerAnimation: row, start: 'left right', onEnter } })
    await Promise.resolve()

    // The item's left edge meets the viewport's right edge at row progress 0.35:
    // 1000 + 0.35 × 2000 = 1700px of page scroll.
    scrollY = 1650
    window.dispatchEvent(new Event('scroll'))
    expect(onEnter).not.toHaveBeenCalled()
    scrollY = 1750
    window.dispatchEvent(new Event('scroll'))
    expect(onEnter).toHaveBeenCalledTimes(1)
  })
})

describe('onUpdate while scrubbing', () => {
  it('fires as scroll moves the playhead', async () => {
    const onUpdate = vi.fn()
    live
      .timeline({ onUpdate, scrollTrigger: { trigger: '#panel', start: 'top top', end: '+=1000', scrub: true } })
      .to('#box', { x: 100, duration: 1 })
    await Promise.resolve()
    const before = onUpdate.mock.calls.length
    scrollTo(1500)
    expect(onUpdate.mock.calls.length).toBeGreaterThan(before)
  })
})
