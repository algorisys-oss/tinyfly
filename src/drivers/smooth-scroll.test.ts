// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SmoothScroll, type SmoothScrollFrames } from './smooth-scroll'
import { ScrollDriver } from './scroll-driver'

/**
 * SmoothScroll on a scrolling element with fixed geometry, driven frame by frame.
 */

function manualFrames() {
  let pending: ((time: number) => void) | null = null
  let now = 0
  const frames: SmoothScrollFrames = {
    request(callback) {
      pending = callback
      return 1
    },
    cancel() {
      pending = null
    },
  }
  return {
    frames,
    /** Run frames 1/60s apart until nothing is pending, or `max` frames. */
    run(max = 600) {
      let count = 0
      while (pending && count < max) {
        const callback = pending
        pending = null
        now += 1000 / 60
        callback(now)
        count++
      }
      return count
    },
    step(count: number) {
      return this.run(count)
    },
    get pending() {
      return pending !== null
    },
  }
}

/** A 500px-tall scroller over 3000px of content. */
function makeScroller(): HTMLElement {
  const scroller = document.createElement('div')
  let top = 0
  Object.defineProperties(scroller, {
    clientHeight: { get: () => 500 },
    scrollHeight: { get: () => 3000 },
    scrollTop: {
      get: () => top,
      set: (value: number) => {
        top = Math.max(0, Math.min(2500, value))
        scroller.dispatchEvent(new Event('scroll'))
      },
    },
  })
  scroller.getBoundingClientRect = () => ({ top: 0, left: 0, right: 400, bottom: 500, width: 400, height: 500, x: 0, y: 0, toJSON: () => ({}) })
  document.body.appendChild(scroller)
  return scroller
}

function wheel(target: EventTarget, deltaY: number, init: WheelEventInit = {}) {
  const event = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true, ...init })
  // happy-dom leaves modifier keys off WheelEvent.
  if (init.ctrlKey) Object.defineProperty(event, 'ctrlKey', { value: true })
  target.dispatchEvent(event)
  return event
}

let scroller: HTMLElement
let clock: ReturnType<typeof manualFrames>
let smooth: SmoothScroll

beforeEach(() => {
  document.body.innerHTML = ''
  scroller = makeScroller()
  clock = manualFrames()
})

afterEach(() => smooth?.destroy())

describe('SmoothScroll', () => {
  it('eases wheel input to its destination over time', () => {
    smooth = new SmoothScroll({ scroller, smooth: 0.6, frames: clock.frames, reducedMotion: false }).start()
    const event = wheel(scroller, 400)
    expect(event.defaultPrevented).toBe(true)
    expect(scroller.scrollTop).toBe(0)

    clock.step(6) // 0.1s
    const early = scroller.scrollTop
    expect(early).toBeGreaterThan(0)
    expect(early).toBeLessThan(400)

    clock.run()
    expect(scroller.scrollTop).toBe(400)
    expect(clock.pending).toBe(false)
  })

  it('adds up wheel input and stops at the ends', () => {
    smooth = new SmoothScroll({ scroller, frames: clock.frames, reducedMotion: false }).start()
    for (let i = 0; i < 10; i++) wheel(scroller, 1000)
    clock.run()
    expect(scroller.scrollTop).toBe(2500)
    // At the end, the wheel is the browser's again.
    expect(wheel(scroller, 100).defaultPrevented).toBe(false)
  })

  it('converts line and page wheel deltas', () => {
    smooth = new SmoothScroll({ scroller, frames: clock.frames, reducedMotion: false }).start()
    wheel(scroller, 3, { deltaMode: 1 })
    clock.run()
    expect(scroller.scrollTop).toBe(48)
    wheel(scroller, 1, { deltaMode: 2 })
    clock.run()
    expect(scroller.scrollTop).toBe(548)
  })

  it('follows scrolling it did not cause, then smooths from there', () => {
    smooth = new SmoothScroll({ scroller, frames: clock.frames, reducedMotion: false }).start()
    wheel(scroller, 600)
    clock.step(3)
    scroller.scrollTop = 1500 // a scrollbar drag or keyboard
    expect(smooth.state.target).toBe(1500)
    clock.run()
    expect(scroller.scrollTop).toBe(1500)
    wheel(scroller, 100)
    clock.run()
    expect(scroller.scrollTop).toBe(1600)
  })

  it('leaves the wheel alone with reduced motion, while paused, for pinch-zoom and sideways scrolling', () => {
    smooth = new SmoothScroll({ scroller, frames: clock.frames, reducedMotion: true }).start()
    expect(wheel(scroller, 300).defaultPrevented).toBe(false)
    smooth.destroy()

    smooth = new SmoothScroll({ scroller, frames: clock.frames, reducedMotion: false }).start()
    expect(wheel(scroller, 300, { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(wheel(scroller, 10, { deltaX: 200 }).defaultPrevented).toBe(false)
    smooth.paused(true)
    expect(wheel(scroller, 300).defaultPrevented).toBe(false)
    smooth.paused(false)
    expect(wheel(scroller, 300).defaultPrevented).toBe(true)
  })

  it('scrolls to an offset or an element, eased, with an offset', () => {
    const section = document.createElement('section')
    section.getBoundingClientRect = () => ({ top: 1200 - scroller.scrollTop, left: 0, right: 400, bottom: 1400 - scroller.scrollTop, width: 400, height: 200, x: 0, y: 0, toJSON: () => ({}) })
    scroller.appendChild(section)
    section.id = 'contact'

    smooth = new SmoothScroll({ scroller, frames: clock.frames, reducedMotion: false }).start()
    smooth.scrollTo('#contact', { offset: -100, duration: 0.5 })
    clock.step(15)
    expect(scroller.scrollTop).toBeGreaterThan(300)
    expect(scroller.scrollTop).toBeLessThan(1100)
    clock.run()
    expect(scroller.scrollTop).toBe(1100)

    smooth.scrollTo(0, { duration: 0 })
    expect(scroller.scrollTop).toBe(0)
  })

  it('moves data-speed elements at their fraction of the scroll, natural when centred', () => {
    const layer = document.createElement('div')
    layer.dataset.speed = '0.5'
    // Natural top 1000, height 100: centred in the 500px viewport at scroll 800.
    layer.getBoundingClientRect = () => ({ top: 1000 - scroller.scrollTop, left: 0, right: 100, bottom: 1100 - scroller.scrollTop, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })
    scroller.appendChild(layer)

    smooth = new SmoothScroll({ scroller, frames: clock.frames, effects: true, reducedMotion: false }).start()
    smooth.scrollTo(800, { duration: 0 })
    expect(layer.style.getPropertyValue('translate')).toBe('')
    smooth.scrollTo(1000, { duration: 0 })
    expect(layer.style.getPropertyValue('translate')).toBe('0 100px')

    smooth.destroy()
    expect(layer.style.getPropertyValue('translate')).toBe('')
  })

  it('rests effect layers while scroll triggers measure, then measures them again', () => {
    let natural = 1000
    const layer = document.createElement('div')
    layer.dataset.speed = '0.5'
    layer.getBoundingClientRect = () => ({ top: natural - scroller.scrollTop, left: 0, right: 100, bottom: natural + 100 - scroller.scrollTop, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })
    scroller.appendChild(layer)
    smooth = new SmoothScroll({ scroller, frames: clock.frames, effects: true, reducedMotion: false }).start()
    smooth.scrollTo(1000, { duration: 0 })
    expect(layer.style.getPropertyValue('translate')).toBe('0 100px')

    let seenWhileMeasuring = ''
    const probe = new ScrollDriver({ trigger: layer, scroller, onRefresh: () => {} })
    const original = probe.refresh.bind(probe)
    probe.refresh = () => {
      seenWhileMeasuring = layer.style.getPropertyValue('translate')
      natural = 1200 // a pin above pushed the layer down
      original()
    }
    probe.start()
    ScrollDriver.refreshAll()
    expect(seenWhileMeasuring).toBe('')
    // Centred at 1000 now, so at scroll 1000 it sits at its natural place.
    expect(layer.style.getPropertyValue('translate')).toBe('')
    probe.destroy()
  })

  it('lets data-lag elements catch up after the page moves', () => {
    const layer = document.createElement('div')
    layer.dataset.lag = '0.5'
    layer.getBoundingClientRect = () => ({ top: 600 - scroller.scrollTop, left: 0, right: 100, bottom: 700 - scroller.scrollTop, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })
    scroller.appendChild(layer)

    smooth = new SmoothScroll({ scroller, frames: clock.frames, effects: true, smooth: 0.2, reducedMotion: false }).start()
    wheel(scroller, 300)
    clock.step(12)
    const behind = Number.parseFloat(layer.style.getPropertyValue('translate').split(' ')[1])
    expect(behind).toBeGreaterThan(0)
    clock.run()
    expect(layer.style.getPropertyValue('translate')).toBe('')
  })
})
