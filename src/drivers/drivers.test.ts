import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VisibilityDriver, playWhenVisible } from './visibility-driver'
import { ScrollDriver } from './scroll-driver'
import { Timeline } from '../engine'
import { createTrack } from '../engine'

/**
 * Drivers decide when a timeline advances and to what time. These tests fake
 * the browser APIs (IntersectionObserver, scroll events, getBoundingClientRect)
 * so driver logic is exercised without a real DOM.
 */

function buildTimeline() {
  return new Timeline({
    id: 'tl',
    tracks: [
      createTrack({
        id: 'o',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      }),
    ],
  })
}

// --- IntersectionObserver fake -------------------------------------------

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []
  observed: Element[] = []
  disconnected = false

  callback: ObserverCallback
  options: unknown

  constructor(callback: ObserverCallback, options: unknown) {
    this.callback = callback
    this.options = options
    FakeIntersectionObserver.instances.push(this)
  }

  observe(el: Element) { this.observed.push(el) }
  disconnect() { this.disconnected = true }

  /** Drive the callback as the browser would. */
  emit(isIntersecting: boolean) { this.callback([{ isIntersecting }]) }
}

describe('VisibilityDriver', () => {
  const trigger = {} as Element

  beforeEach(() => {
    FakeIntersectionObserver.instances = []
    ;(globalThis as Record<string, unknown>).IntersectionObserver = FakeIntersectionObserver
  })

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).IntersectionObserver
  })

  const latest = () => FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1]

  it('does not play before the trigger appears', () => {
    const timeline = buildTimeline()
    new VisibilityDriver({ timeline, trigger }).start()
    expect(timeline.playbackState).toBe('idle')
  })

  it('plays when the trigger enters the viewport', () => {
    const timeline = buildTimeline()
    new VisibilityDriver({ timeline, trigger }).start()
    latest().emit(true)
    expect(timeline.playbackState).toBe('playing')
  })

  it('observes the trigger element', () => {
    new VisibilityDriver({ timeline: buildTimeline(), trigger }).start()
    expect(latest().observed).toEqual([trigger])
  })

  it('passes the threshold through to the observer', () => {
    new VisibilityDriver({ timeline: buildTimeline(), trigger, threshold: 0.75 }).start()
    expect((latest().options as { threshold: number }).threshold).toBe(0.75)
  })

  it('only plays once by default', () => {
    const timeline = buildTimeline()
    new VisibilityDriver({ timeline, trigger }).start()

    latest().emit(true)
    timeline.tick(400)
    const afterFirst = timeline.currentTime

    latest().emit(false)
    latest().emit(true)
    // A second entry must not rewind an animation that is mid-flight.
    expect(timeline.currentTime).toBe(afterFirst)
  })

  it('rewinds and replays with behaviour: repeat', () => {
    const timeline = buildTimeline()
    new VisibilityDriver({ timeline, trigger, behaviour: 'repeat' }).start()

    latest().emit(true)
    timeline.tick(400)
    expect(timeline.currentTime).toBe(400)

    latest().emit(false)
    latest().emit(true)
    expect(timeline.currentTime).toBe(0)
    expect(timeline.playbackState).toBe('playing')
  })

  it('rewinds on exit with behaviour: reset', () => {
    const timeline = buildTimeline()
    new VisibilityDriver({ timeline, trigger, behaviour: 'reset' }).start()

    latest().emit(true)
    timeline.tick(400)
    latest().emit(false)

    expect(timeline.currentTime).toBe(0)
    expect(timeline.playbackState).toBe('idle')
  })

  it('fires onEnter and onLeave', () => {
    const onEnter = vi.fn()
    const onLeave = vi.fn()
    new VisibilityDriver({ timeline: buildTimeline(), trigger, onEnter, onLeave }).start()

    latest().emit(true)
    latest().emit(false)

    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onLeave).toHaveBeenCalledTimes(1)
  })

  it('disconnects on stop', () => {
    const driver = new VisibilityDriver({ timeline: buildTimeline(), trigger })
    driver.start()
    driver.stop()
    expect(latest().disconnected).toBe(true)
  })

  it('ignores a second start', () => {
    const driver = new VisibilityDriver({ timeline: buildTimeline(), trigger })
    driver.start()
    driver.start()
    expect(FakeIntersectionObserver.instances).toHaveLength(1)
  })

  it('reset() lets a once-driver fire again', () => {
    const timeline = buildTimeline()
    const driver = new VisibilityDriver({ timeline, trigger })
    driver.start()

    latest().emit(true)
    timeline.tick(400)
    driver.reset()
    latest().emit(true)

    expect(timeline.currentTime).toBe(0)
    expect(timeline.playbackState).toBe('playing')
  })

  it('plays immediately when IntersectionObserver is unavailable', () => {
    delete (globalThis as Record<string, unknown>).IntersectionObserver
    const timeline = buildTimeline()
    new VisibilityDriver({ timeline, trigger }).start()
    // Better to show the animation than to leave it stuck at frame 0.
    expect(timeline.playbackState).toBe('playing')
  })

  it('playWhenVisible returns a started driver', () => {
    const timeline = buildTimeline()
    playWhenVisible({ timeline, trigger })
    expect(latest().observed).toHaveLength(1)
    latest().emit(true)
    expect(timeline.playbackState).toBe('playing')
  })
})

// --- ScrollDriver ---------------------------------------------------------

describe('ScrollDriver', () => {
  let listeners: Record<string, Array<() => void>>
  /** Started drivers, stopped after each test: resize handling is shared between drivers. */
  let startedDrivers: ScrollDriver[]

  /** A trigger element whose rect we can move between samples. */
  function makeTrigger(top: number, height = 500) {
    const state = { top, height }
    const el = {
      getBoundingClientRect: () => ({
        top: state.top,
        bottom: state.top + state.height,
        height: state.height,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: state.top,
        toJSON: () => ({}),
      }),
    } as unknown as Element
    return { el, state }
  }

  beforeEach(() => {
    listeners = {}
    startedDrivers = []
    const start = ScrollDriver.prototype.start
    vi.spyOn(ScrollDriver.prototype, 'start').mockImplementation(function (this: ScrollDriver) {
      startedDrivers.push(this)
      start.call(this)
    })
    ;(globalThis as Record<string, unknown>).window = {
      innerHeight: 1000,
      scrollY: 0,
      addEventListener: (type: string, fn: () => void) => {
        ;(listeners[type] ??= []).push(fn)
      },
      removeEventListener: (type: string, fn: () => void) => {
        listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn)
      },
    }
  })

  afterEach(() => {
    for (const driver of startedDrivers) driver.destroy()
    vi.restoreAllMocks()
    delete (globalThis as Record<string, unknown>).window
  })

  it('pauses the timeline so it does not also self-advance', () => {
    const timeline = buildTimeline()
    timeline.play()
    const { el } = makeTrigger(1500)
    new ScrollDriver({ timeline, trigger: el }).start()
    expect(timeline.playbackState).toBe('paused')
  })

  it('holds the playhead at 0 before the start trigger', () => {
    const timeline = buildTimeline()
    const { el } = makeTrigger(1500)
    new ScrollDriver({ timeline, trigger: el }).start()
    expect(timeline.currentTime).toBe(0)
  })

  it('seeks proportionally through the active range', () => {
    const timeline = buildTimeline()
    const { el, state } = makeTrigger(1500)
    const driver = new ScrollDriver({ timeline, trigger: el })
    driver.start()

    // Halfway through a span of (height 500 + viewport 1000) = 1500px.
    state.top = 250
    driver.sample()

    expect(timeline.currentTime).toBeCloseTo(500, 6)
  })

  it('holds the playhead at the end past the end trigger', () => {
    const timeline = buildTimeline()
    const { el, state } = makeTrigger(1500)
    const driver = new ScrollDriver({ timeline, trigger: el })
    driver.start()

    state.top = -900
    driver.sample()

    expect(timeline.currentTime).toBe(1000)
  })

  it('reports progress', () => {
    const { el, state } = makeTrigger(1500)
    const driver = new ScrollDriver({ timeline: buildTimeline(), trigger: el })
    driver.start()

    state.top = 250
    driver.sample()

    expect(driver.progress).toBeCloseTo(0.5, 6)
  })

  it('calls onUpdate with progress', () => {
    const onUpdate = vi.fn()
    const { el, state } = makeTrigger(1500)
    const driver = new ScrollDriver({ timeline: buildTimeline(), trigger: el, onUpdate })
    driver.start()

    state.top = 250
    driver.sample()

    expect(onUpdate).toHaveBeenLastCalledWith(expect.closeTo(0.5, 6), 0)
  })

  it('honours custom start and end triggers', () => {
    const timeline = buildTimeline()
    const { el, state } = makeTrigger(0)
    const driver = new ScrollDriver({
      timeline,
      trigger: el,
      start: 'top top',
      end: 'top top+=500',
    })
    driver.start()

    state.top = -250
    driver.sample()
    expect(timeline.currentTime).toBeCloseTo(500, 6)
  })

  it('updates on scroll events from the scroll offset alone, without re-measuring', () => {
    const timeline = buildTimeline()
    const { el, state } = makeTrigger(1500)
    new ScrollDriver({ timeline, trigger: el }).start()

    // Scrolling 1250px down moves the element up by the same amount; the driver
    // must get there from the scroll offset (the rect below is deliberately stale).
    ;(window as unknown as { scrollY: number }).scrollY = 1250
    state.top = 99999
    for (const fn of listeners.scroll ?? []) fn()

    expect(timeline.currentTime).toBeCloseTo(500, 6)
  })

  it('re-samples on resize', () => {
    const timeline = buildTimeline()
    const { el, state } = makeTrigger(1500)
    new ScrollDriver({ timeline, trigger: el }).start()

    state.top = 250
    for (const fn of listeners.resize ?? []) fn()

    expect(timeline.currentTime).toBeCloseTo(500, 6)
  })

  it('removes its listeners on stop', () => {
    const { el } = makeTrigger(1500)
    const driver = new ScrollDriver({ timeline: buildTimeline(), trigger: el })
    driver.start()
    driver.stop()

    expect(listeners.scroll ?? []).toHaveLength(0)
    expect(listeners.resize ?? []).toHaveLength(0)
  })

  it('fires onEnter crossing into the range and onLeave crossing out', () => {
    const onEnter = vi.fn()
    const onLeave = vi.fn()
    const { el, state } = makeTrigger(1500)
    const driver = new ScrollDriver({ timeline: buildTimeline(), trigger: el, onEnter, onLeave })
    driver.start()

    state.top = 250
    driver.sample()
    expect(onEnter).toHaveBeenCalledTimes(1)

    state.top = -900
    driver.sample()
    expect(onLeave).toHaveBeenCalledTimes(1)
  })

  it('fires onEnterBack and onLeaveBack when scrolling up', () => {
    const onEnterBack = vi.fn()
    const onLeaveBack = vi.fn()
    const { el, state } = makeTrigger(-900)
    const driver = new ScrollDriver({
      timeline: buildTimeline(),
      trigger: el,
      onEnterBack,
      onLeaveBack,
    })
    driver.start()

    state.top = 250 // scrolling back up into the range
    driver.sample()
    expect(onEnterBack).toHaveBeenCalledTimes(1)

    state.top = 1500 // and back out above it
    driver.sample()
    expect(onLeaveBack).toHaveBeenCalledTimes(1)
  })

  it('does not seek immediately when smoothing is on', () => {
    const timeline = buildTimeline()
    const { el, state } = makeTrigger(1500)
    const driver = new ScrollDriver({ timeline, trigger: el, scrub: 0.5 })
    driver.start()

    state.top = 250
    driver.sample()

    // The target moved but the playhead eases toward it on subsequent frames.
    expect(driver.progress).toBeCloseTo(0.5, 6)
    expect(timeline.currentTime).toBe(0)
  })

  it('measures against a scroll container when given', () => {
    const timeline = buildTimeline()
    // Trigger is 500 tall; the scroller's own box starts at viewport y=1000 and
    // is 500 tall, so positions are measured relative to that.
    const { el, state } = makeTrigger(1600)
    const scroller = {
      clientHeight: 500,
      getBoundingClientRect: () => ({ top: 1000, bottom: 1500, height: 500 }),
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as HTMLElement

    const driver = new ScrollDriver({ timeline, trigger: el, scroller })
    driver.start()
    // Relative top 600 > the scroller's 500 height: below the fold, not started.
    expect(timeline.currentTime).toBe(0)

    // Relative top 500: the element's top is exactly at the scroller's bottom.
    state.top = 1500
    driver.sample()
    expect(timeline.currentTime).toBe(0)

    // Relative top 250: a quarter of the way through the 1000px span.
    state.top = 1250
    driver.sample()
    expect(timeline.currentTime).toBeCloseTo(250, 6)

    // Relative top -500: the element's bottom reaches the scroller's top.
    state.top = 500
    driver.sample()
    expect(timeline.currentTime).toBe(1000)
  })
})
