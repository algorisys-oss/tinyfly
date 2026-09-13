// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ScrollDriver } from './scroll-driver'
import { Timeline, createTrack } from '../engine'

/**
 * Pinning, relative ends, fast flicks, velocity and pushed scroll positions.
 * happy-dom has no layout, so element geometry is given explicitly: `layout`
 * places elements at a document y, and the viewport rect follows scrollY.
 */

const drivers: ScrollDriver[] = []
const make = (options: ConstructorParameters<typeof ScrollDriver>[0]) => {
  const driver = new ScrollDriver(options)
  drivers.push(driver)
  return driver
}

let scrollY = 0
const pageTop = new Map<Element, { top: number; height: number }>()

function place(el: Element, top: number, height: number) {
  pageTop.set(el, { top, height })
}

function scrollTo(y: number) {
  scrollY = y
  window.dispatchEvent(new Event('scroll'))
}

beforeEach(() => {
  document.body.innerHTML = '<section id="s"></section><div id="after"></div>'
  scrollY = 0
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    // A sticky element measured while released sits where its spacer is.
    const own = pageTop.get(this) ?? (this.parentElement ? pageTop.get(this.parentElement) : undefined) ?? { top: 0, height: 0 }
    const top = own.top - scrollY
    return { top, bottom: top + own.height, height: own.height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect
  })
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return pageTop.get(this)?.height ?? 0
  })
})

afterEach(() => {
  for (const driver of drivers.splice(0)) driver.destroy()
  vi.restoreAllMocks()
})

const section = () => document.getElementById('s') as HTMLElement

function timeline() {
  return new Timeline({
    id: 't',
    tracks: [createTrack({ id: 'x', target: 'box', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 100 }] })],
  })
}

describe('ScrollDriver — ranges', () => {
  it("resolves end: '+=600' as 600px after the start, and '+=50%' as half a viewport", () => {
    place(section(), 2000, 400)
    const tl = timeline()
    make({ timeline: tl, trigger: section(), start: 'top top', end: '+=600' }).start()
    scrollTo(2300)
    expect(tl.currentTime).toBeCloseTo(500)

    const tl2 = timeline()
    make({ timeline: tl2, trigger: section(), start: 'top top', end: '+=50%' }).start()
    scrollTo(2250)
    expect(tl2.currentTime).toBeCloseTo(500)
  })

  it('fires enter and leave together when one scroll jumps across the whole range', () => {
    place(section(), 2000, 100)
    const calls: string[] = []
    make({
      trigger: section(),
      start: 'top top',
      end: '+=100',
      onEnter: () => calls.push('enter'),
      onLeave: () => calls.push('leave'),
      onEnterBack: () => calls.push('enterBack'),
      onLeaveBack: () => calls.push('leaveBack'),
    }).start()
    scrollTo(5000)
    scrollTo(0)
    expect(calls).toEqual(['enter', 'leave', 'enterBack', 'leaveBack'])
  })

  it('starting already past the range reports progress 1 and fires both edges', () => {
    place(section(), 100, 100)
    scrollY = 3000
    const onEnter = vi.fn()
    const onLeave = vi.fn()
    const driver = make({ trigger: section(), start: 'top top', end: '+=100', onEnter, onLeave })
    driver.start()
    expect(driver.progress).toBe(1)
    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onLeave).toHaveBeenCalledTimes(1)
  })

  it('works without a timeline, and accepts pushed scroll positions (smooth-scroll libraries)', () => {
    place(section(), 1000, 500)
    const onUpdate = vi.fn()
    const driver = make({ trigger: section(), start: 'top top', end: '+=1000', onUpdate })
    driver.start()
    driver.update(1500)
    expect(driver.progress).toBeCloseTo(0.5)
    expect(onUpdate).toHaveBeenLastCalledWith(expect.closeTo(0.5), expect.any(Number))
  })
})

describe('ScrollDriver — velocity', () => {
  it('reports scroll speed, then 0 shortly after scrolling stops', () => {
    vi.useFakeTimers()
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    place(section(), 0, 5000)
    const onUpdate = vi.fn()
    const driver = make({ trigger: section(), start: 'top top', end: 'bottom top', onUpdate })
    driver.start()

    now = 100
    scrollTo(100)
    now = 200
    scrollTo(300) // 200px in 100ms
    expect(driver.velocity).toBeCloseTo(2000)

    vi.advanceTimersByTime(200)
    expect(driver.velocity).toBe(0)
    expect(onUpdate).toHaveBeenLastCalledWith(expect.any(Number), 0)
    vi.useRealTimers()
  })
})

describe('ScrollDriver — pinning', () => {
  it('wraps the pinned element in a spacer tall enough for the pin, and sticks it where the range starts', () => {
    place(section(), 1000, 400)
    make({ trigger: section(), start: 'top top', end: '+=1500', pin: true }).start()

    const spacer = section().parentElement as HTMLElement
    expect(spacer.className).toBe('pin-spacer')
    expect(spacer.style.height).toBe('1900px')
    expect(section().style.position).toBe('sticky')
    expect(section().style.top).toBe('0px')
  })

  it("sticks at the viewport offset the start names ('top 20%' → 200px)", () => {
    place(section(), 1000, 400)
    make({ trigger: section(), start: 'top 20%', end: '+=500', pin: true }).start()
    expect(section().style.top).toBe('200px')
  })

  it('removes the spacer and restores styles on destroy', () => {
    place(section(), 1000, 400)
    const driver = make({ trigger: section(), start: 'top top', end: '+=500', pin: true })
    driver.start()
    driver.destroy()
    expect(section().parentElement).toBe(document.body)
    expect(section().style.position).toBe('')
    expect(document.querySelector('.pin-spacer')).toBeNull()
  })
})

describe('ScrollDriver — smoothing', () => {
  it('starts at the page position, eases toward scrolls, and stops its frame loop once settled', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})

    place(section(), 0, 1000)
    scrollY = 500
    const tl = timeline()
    make({ timeline: tl, trigger: section(), start: 'top top', end: '+=1000', scrub: 0.1 }).start()
    // No easing in from 0 on load.
    expect(tl.currentTime).toBeCloseTo(500)
    expect(frames).toHaveLength(0)

    scrollTo(1000)
    let t = 0
    let ran = 0
    while (frames.length && ran < 500) {
      const cb = frames.shift()!
      t += 16
      cb(t)
      ran++
    }
    expect(tl.currentTime).toBeCloseTo(1000)
    expect(frames).toHaveLength(0) // the loop ended by itself
    expect(ran).toBeLessThan(100)
    vi.unstubAllGlobals()
  })
})

describe('ScrollDriver — snap', () => {
  it('scrolls on to the nearest snap point once scrolling stops inside the range', () => {
    vi.useFakeTimers()
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const scrollToSpy = vi.fn((options: ScrollToOptions) => scrollTo(options.top ?? 0))
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo

    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    place(section(), 1000, 400)
    make({ trigger: section(), start: 'top top', end: '+=1000', snap: { snapTo: 0.5, duration: 0.1 } }).start()
    now = 16
    scrollTo(1290)
    now = 32
    scrollTo(1300) // progress 0.3, drifting slowly on: 0.5 is nearest
    vi.advanceTimersByTime(200) // scrolling stops
    let t = 0
    while (frames.length) frames.shift()!((t += 16))
    expect(scrollToSpy).toHaveBeenLastCalledWith({ top: 1500, behavior: 'instant' })

    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not snap outside the range', () => {
    vi.useFakeTimers()
    const scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo
    place(section(), 1000, 400)
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    make({ trigger: section(), start: 'top top', end: '+=1000', snap: 0.5 }).start()
    now = 16
    scrollTo(300)
    vi.advanceTimersByTime(200)
    expect(scrollToSpy).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe('ScrollDriver — markers', () => {
  it('draws start and end markers where the range begins and ends, and removes them on destroy', () => {
    place(section(), 1000, 400)
    const driver = make({ trigger: section(), start: 'top 20%', end: '+=500', markers: { id: 'hero' } })
    driver.start()
    const markers = [...document.querySelectorAll<HTMLElement>('.scroll-marker')]
    const byLabel = Object.fromEntries(markers.map((node) => [node.textContent, node]))
    expect(Object.keys(byLabel).sort()).toEqual(['hero end', 'hero scroller-end', 'hero scroller-start', 'hero start'])
    // The trigger's top (page 1000) meets the line 200px down the viewport.
    expect(byLabel['hero start'].style.top).toBe('1000px')
    expect(byLabel['hero scroller-start'].style.top).toBe('200px')
    expect(byLabel['hero scroller-start'].style.position).toBe('fixed')
    expect(byLabel['hero end'].style.top).toBe('1500px')

    driver.destroy()
    expect(document.querySelector('.scroll-marker')).toBeNull()
  })
})
