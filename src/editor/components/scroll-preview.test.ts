import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ScrollDriver } from '../../drivers'
import { createEditorStore } from '../stores/editor-store'

/**
 * The scroll-scrub preview (Phase 26A) wires a real `ScrollDriver` to the
 * editor's timeline against a real scroll container — it is not a simulation.
 * These tests cover that wiring: the driver moves the engine's playhead, and
 * `syncPlayheadFromTimeline` mirrors it into the store's signal so the editor's
 * readouts follow.
 */

function makeStore() {
  const store = createEditorStore()
  store.createNewTimeline('tl', 'Scroll')
  store.addTrack({
    id: 'o',
    target: 'box',
    property: 'opacity',
    keyframes: [
      { time: 0, value: 0 },
      { time: 1000, value: 1 },
    ],
  })
  return store
}

/** A trigger element whose rect the test can move, as the preview's strip does. */
function makeTrigger(top: number, height = 500) {
  const state = { top, height }
  const el = {
    getBoundingClientRect: () => ({
      top: state.top,
      bottom: state.top + state.height,
      height: state.height,
      left: 0, right: 0, width: 0, x: 0, y: state.top,
      toJSON: () => ({}),
    }),
  } as unknown as Element
  return { el, state }
}

function makeScroller() {
  return {
    clientHeight: 1000,
    getBoundingClientRect: () => ({ top: 0, bottom: 1000, height: 1000 }),
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLElement
}

describe('scroll preview wiring', () => {
  beforeEach(() => {
    ;(globalThis as Record<string, unknown>).window = {
      innerHeight: 1000,
      addEventListener: () => {},
      removeEventListener: () => {},
    }
  })

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window
  })

  it('pauses playback, so scroll is the only thing moving the playhead', () => {
    const store = makeStore()
    store.play()

    const { el } = makeTrigger(1500)
    new ScrollDriver({ timeline: store.state.timeline!, trigger: el, scroller: makeScroller() }).start()

    expect(store.state.timeline!.playbackState).toBe('paused')
  })

  it('scrubs the engine playhead as the strip scrolls', () => {
    const store = makeStore()
    const { el, state } = makeTrigger(1000)
    const driver = new ScrollDriver({
      timeline: store.state.timeline!,
      trigger: el,
      scroller: makeScroller(),
    })
    driver.start()
    expect(store.state.timeline!.currentTime).toBe(0)

    // Halfway through the span (trigger height 500 + scroller height 1000).
    state.top = 250
    driver.sample()
    expect(store.state.timeline!.currentTime).toBeCloseTo(500, 6)
  })

  it('syncPlayheadFromTimeline mirrors the driver into the store signal', () => {
    const store = makeStore()
    const { el, state } = makeTrigger(1000)
    const driver = new ScrollDriver({
      timeline: store.state.timeline!,
      trigger: el,
      scroller: makeScroller(),
      onUpdate: () => store.syncPlayheadFromTimeline(),
    })
    driver.start()

    state.top = 250
    driver.sample()

    // Without the sync the store's readout would still say 0.
    expect(store.currentTime()).toBeCloseTo(500, 6)
  })

  it('reports progress for the percentage readout', () => {
    const store = makeStore()
    const { el, state } = makeTrigger(1000)
    let progress = -1
    const driver = new ScrollDriver({
      timeline: store.state.timeline!,
      trigger: el,
      scroller: makeScroller(),
      onUpdate: (value) => { progress = value },
    })
    driver.start()

    state.top = 250
    driver.sample()
    expect(progress).toBeCloseTo(0.5, 6)
  })

  it('honours the trigger presets the preview offers', () => {
    const store = makeStore()
    const { el, state } = makeTrigger(0)
    const driver = new ScrollDriver({
      timeline: store.state.timeline!,
      trigger: el,
      scroller: makeScroller(),
      start: 'top top',
      end: 'top top+=500',
    })
    driver.start()

    state.top = -250
    driver.sample()
    expect(store.state.timeline!.currentTime).toBeCloseTo(500, 6)
  })

  it('releases its listeners when the preview is closed', () => {
    const store = makeStore()
    const { el } = makeTrigger(1000)
    const driver = new ScrollDriver({
      timeline: store.state.timeline!,
      trigger: el,
      scroller: makeScroller(),
    })
    driver.start()
    expect(() => driver.destroy()).not.toThrow()
  })

  it('does nothing harmful on a scene with no duration', () => {
    const store = createEditorStore()
    store.createNewTimeline('empty', 'Empty')
    const { el, state } = makeTrigger(1000)
    const driver = new ScrollDriver({
      timeline: store.state.timeline!,
      trigger: el,
      scroller: makeScroller(),
    })
    driver.start()

    state.top = 250
    expect(() => driver.sample()).not.toThrow()
    expect(store.state.timeline!.currentTime).toBe(0)
  })
})
