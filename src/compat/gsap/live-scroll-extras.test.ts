// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage } from './stage'
import { Timeline, createTrack } from '../../engine'
import { ScrollDriver as Driver } from '../../drivers'

/**
 * Scroll extras: horizontal scrollers, pinSpacing: false, scrollTo and batches.
 * happy-dom lays nothing out, so geometry is given explicitly.
 */

let live: LiveApi
let pending: ((t: number) => void) | null = null
let now = 0
const frames = (count: number, step = 50) => {
  for (let i = 0; i < count; i++) {
    const callback = pending
    pending = null
    now += step
    callback?.(now)
  }
}

beforeEach(() => {
  document.body.innerHTML = ''
  now = 0
  live = createLive(new Stage({ scheduler: { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) } }))
})
afterEach(() => vi.restoreAllMocks())

const timeline = () => {
  const tl = new Timeline({ id: 't', config: { duration: 1000 } })
  tl.addTrack(createTrack({ id: 'x', target: 'a', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 100 }] }))
  return tl
}

describe('horizontal scrollers', () => {
  it('measures positions along x and follows scrollLeft', () => {
    let left = 0
    const scroller = document.createElement('div')
    Object.defineProperties(scroller, { clientWidth: { value: 1000 }, scrollLeft: { get: () => left } })
    scroller.getBoundingClientRect = () => ({ top: 0, bottom: 500, height: 500, left: 0, right: 1000, width: 1000 }) as DOMRect
    const panel = document.createElement('section')
    panel.getBoundingClientRect = () => ({ top: 0, bottom: 500, height: 500, left: 2000 - left, right: 2500 - left, width: 500 }) as DOMRect
    const tl = timeline()
    const driver = new Driver({ timeline: tl, trigger: panel, scroller, horizontal: true, start: 'left right', end: 'right left' })
    driver.start()
    expect(driver.startOffset).toBe(1000)
    expect(driver.endOffset).toBe(2500)
    left = 1750
    driver.sample()
    expect(driver.progress).toBeCloseTo(0.5)
    driver.destroy()
  })
})

describe('pinSpacing: false', () => {
  it('gives the pinned distance back with a negative margin', () => {
    document.body.innerHTML = '<section id="s"></section>'
    const section = document.getElementById('s')!
    Object.defineProperty(section, 'offsetHeight', { value: 400 })
    section.getBoundingClientRect = () => ({ top: 0, bottom: 400, height: 400, left: 0, right: 0, width: 0 }) as DOMRect
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    const driver = new Driver({ timeline: timeline(), trigger: section, start: 'top top', end: '+=600', pin: true, pinSpacing: false })
    driver.start()
    const spacer = section.parentElement!
    expect(spacer.className).toBe('pin-spacer')
    expect(spacer.style.height).toBe('1000px')
    expect(spacer.style.marginBottom).toBe('-600px')
    driver.destroy()
  })
})

describe('live.scrollTo', () => {
  it('eases a scroller to an element, less the offset, and can be stopped by the wheel', async () => {
    document.body.innerHTML = '<div id="box"><p id="target"></p></div>'
    const box = document.getElementById('box')!
    let top = 0
    Object.defineProperties(box, {
      scrollTop: { get: () => top, set: (value: number) => (top = value) },
      scrollLeft: { get: () => 0, set: () => {} },
      scrollHeight: { value: 3000 },
      clientHeight: { value: 500 },
      scrollWidth: { value: 400 },
      clientWidth: { value: 400 },
    })
    box.getBoundingClientRect = () => ({ top: 100, left: 0 }) as DOMRect
    document.getElementById('target')!.getBoundingClientRect = () => ({ top: 1300 - top, left: 0 }) as DOMRect

    const done: string[] = []
    live.scrollTo('#target', { scroller: box, offset: 50, duration: 0.5, ease: 'none', onComplete: () => done.push('done') })
    await Promise.resolve()
    frames(1, 0)
    frames(5)
    expect(top).toBeGreaterThan(400)
    expect(top).toBeLessThan(1150)
    frames(10)
    expect(top).toBe(1150)
    expect(done).toEqual(['done'])

    live.to(box, { scrollTo: { y: 0 }, duration: 1 })
    await Promise.resolve()
    frames(1, 0)
    frames(4)
    const stoppedAt = top
    box.dispatchEvent(new Event('wheel'))
    frames(10)
    expect(top).toBe(stoppedAt)
  })
})

describe('live.scrollBatch', () => {
  it('delivers elements that enter together in one call', () => {
    vi.useFakeTimers()
    const created: Array<{ onEnter?: () => void }> = []
    vi.spyOn(Driver.prototype, 'start').mockImplementation(function (this: Driver) {
      created.push((this as unknown as { options: { onEnter?: () => void } }).options)
    })
    document.body.innerHTML = '<i class="card"></i>'.repeat(5)
    const batches: number[] = []
    live.scrollBatch('.card', { interval: 0.1, batchMax: 3, onEnter: (cards) => batches.push(cards.length) })
    expect(created).toHaveLength(5)
    created[0].onEnter?.()
    created[1].onEnter?.()
    created[2].onEnter?.() // batchMax reached
    created[3].onEnter?.()
    expect(batches).toEqual([3])
    vi.advanceTimersByTime(150)
    expect(batches).toEqual([3, 1])
    vi.useRealTimers()
  })
})
