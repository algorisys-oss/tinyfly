import { describe, it, expect } from 'vitest'
import { DeckState } from './deck-state'

const deck = () =>
  new DeckState([
    { id: 'title', marks: [1000] },
    { id: 'points', title: 'Three points', marks: [500, 2000, 4000], timers: [{ step: 2, seconds: 30 }] },
    { id: 'cards', fragmentSteps: 2 },
  ])

describe('DeckState', () => {
  it('takes steps from marks, and pads them up to the fragments', () => {
    const state = deck()
    expect(state.slides.map((slide) => slide.steps)).toEqual([0, 2, 2])
    expect(state.slides[2].marks).toEqual([0, 0, 0])
    expect(state.slides[0].title).toBe('title')
    expect(() => new DeckState([])).toThrow()
  })

  it('plays the entrance, then waits at the mark', () => {
    const state = deck()
    state.goTo(0, 0, { play: true })
    expect(state.slide.time).toBe(0)
    expect(state.playing).toBe(true)
    state.advance(400, 400)
    expect(state.slide.time).toBe(400)
    state.advance(5000, 5400)
    expect(state.slide.time).toBe(1000)
    expect(state.playing).toBe(false)
  })

  it('a second press while a step plays snaps to its end and goes no further', () => {
    const state = deck()
    state.goTo(1)
    expect(state.next(0)).toBe('step')
    expect(state.slide.step).toBe(1)
    expect(state.slide.target).toBe(2000)
    state.advance(100, 100)
    expect(state.next(100)).toBe('snap')
    expect(state.slide.step).toBe(1)
    expect(state.slide.time).toBe(2000)
  })

  it('next starts a countdown, ends it early, and only then moves on', () => {
    const state = deck()
    state.goTo(1, 2)
    expect(state.hint()).toEqual({ kind: 'timer-start', seconds: 30 })
    expect(state.next(1000)).toBe('timer-start')
    expect(state.timerFrame(4000)).toEqual({ state: 'running', elapsed: 3000, seconds: 30, sinceEnd: 0 })
    expect(state.secondsLeft(state.slide.timers[0], 4000)).toBe(27)
    expect(state.secondsLeft(state.slide.timers[0], 990)).toBe(30)
    expect(state.hint()).toEqual({ kind: 'timer-end' })
    expect(state.next(5000)).toBe('timer-end')
    expect(state.timerFrame(5500)).toEqual({ state: 'done', elapsed: 4500, seconds: 30, sinceEnd: 500 })
    expect(state.hint()).toEqual({ kind: 'slide', title: 'cards' })
    expect(state.next(6000)).toBe('slide')
    expect(state.index).toBe(2)
  })

  it('a countdown ends by itself at its length, whatever the frame times', () => {
    const state = deck()
    state.goTo(1, 2)
    state.toggleTimer(1000)
    state.advance(16, 30_999)
    expect(state.slide.timers[0].state).toBe('running')
    state.advance(16, 31_040)
    expect(state.slide.timers[0]).toMatchObject({ state: 'done', endedAt: 31_000 })
    expect(state.next(32_000)).toBe('slide')
  })

  it('toggles only countdowns on the current slide at a step already reached', () => {
    const state = deck()
    state.goTo(1, 1)
    const timer = state.slides[1].timers[0]
    expect(state.toggleTimer(0)).toBe(false)
    expect(state.toggleTimer(0, timer)).toBe(false)
    state.goTo(1, 2)
    expect(state.toggleTimer(0, timer)).toBe(true)
    expect(timer.state).toBe('running')
    state.goTo(2)
    expect(timer.state).toBe('idle')
    expect(state.toggleTimer(0, timer)).toBe(false)
  })

  it('goes back a step shown as it ends, and from a first step to the end of the slide before', () => {
    const state = deck()
    state.goTo(2, 1)
    expect(state.prev()).toBe(true)
    expect([state.index, state.slide.step]).toEqual([2, 0])
    expect(state.prev()).toBe(true)
    expect([state.index, state.slide.step, state.slide.time]).toEqual([1, 2, 4000])
    state.goTo(0)
    expect(state.prev()).toBe(false)
  })

  it('stops at the end, clamps jumps, and replays a step from the one before', () => {
    const state = deck()
    state.goTo(99, 'last')
    expect([state.index, state.slide.step]).toEqual([2, 2])
    expect(state.next(0)).toBe('end')
    expect(state.hint()).toEqual({ kind: 'end' })
    state.goTo(1, 2)
    state.replay()
    expect([state.slide.time, state.slide.target]).toEqual([2000, 4000])
    state.goTo(-5, 7)
    expect([state.index, state.slide.step]).toEqual([0, 0])
  })

  it('takes marks later, when a scene is built', () => {
    const state = deck()
    state.goTo(2, 2)
    state.setMarks(2, [300, 900])
    expect(state.slide.marks).toEqual([300, 900, 900])
    expect([state.slide.step, state.slide.time]).toEqual([2, 900])
    state.setMarks(0, undefined)
    expect(state.slides[0].marks).toEqual([0])
  })
})
