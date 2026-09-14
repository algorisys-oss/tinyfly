// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'

/**
 * Timeline callbacks and control: `call`, `addPause`, tween callbacks inside
 * timelines, `onRepeat`, `onReverseComplete`, `tweenTo`, `delayedCall` and
 * `killTweensOf`.
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
  }
}

const flushMicrotasks = () => Promise.resolve()

let frames: ReturnType<typeof manualScheduler>
let live: LiveApi
let log: string[]

/** Start the clock, then play `ms` in 50ms frames. */
async function play(ms: number) {
  await flushMicrotasks()
  frames.advance(0)
  frames.advance(50, Math.round(ms / 50))
}

beforeEach(() => {
  document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
  frames = manualScheduler()
  live = createLive(new Stage({ scheduler: frames.scheduler }))
  log = []
})

describe('tl.call', () => {
  it('runs callbacks in time order as the playhead reaches them, with params', async () => {
    live
      .timeline()
      .to('#a', { x: 100, duration: 1 })
      .call((name: string) => log.push(`end ${name}`), ['a'])
      .call(() => log.push('start'), [], 0)
      .call(() => log.push('half'), [], 0.5)
    await play(400)
    expect(log).toEqual(['start'])
    await play(700)
    expect(log).toEqual(['start', 'half', 'end a'])
  })

  it('extends the timeline when placed after the last tween', async () => {
    const tl = live.timeline().to('#a', { x: 100, duration: 0.5 }).call(() => log.push('late'), [], 1.5)
    expect(tl.duration()).toBe(1.5)
    await play(1600)
    expect(log).toEqual(['late'])
  })

  it('fires on every loop, and when scrubbing through', async () => {
    const tl = live.timeline({ repeat: 2, onRepeat: () => log.push('repeat') }).to('#a', { x: 100, duration: 0.5 }).call(() => log.push('call'), [], 0.25)
    await play(1600)
    expect(log).toEqual(['call', 'repeat', 'call', 'repeat', 'call'])

    log = []
    tl.pause()
    tl.progress(0)
    tl.progress(1)
    tl.progress(0.2)
    // Back from the end past it, forward past it, and back past it again.
    expect(log).toEqual(['call', 'call', 'call'])
  })

  it('does not fire when seeking past it', async () => {
    const tl = live.timeline({ paused: true }).to('#a', { x: 100, duration: 1 }).call(() => log.push('call'), [], 0.5)
    tl.seek(0.8)
    tl.seek(0.2)
    expect(log).toEqual([])
  })
})

describe('tl.addPause', () => {
  it('stops exactly at the pause, runs its callback, and continues on play()', async () => {
    const tl = live
      .timeline()
      .to('#a', { x: 100, duration: 1, ease: 'none' })
      .addPause(0.5, () => log.push('paused'))
      .call(() => log.push('after'), [], 0.75)
    await play(800)
    expect(log).toEqual(['paused'])
    expect(tl.isActive()).toBe(false)
    expect(tl.progress()).toBeCloseTo(0.5)
    expect(document.getElementById('a')!.style.transform).toContain('50px')

    tl.play()
    frames.advance(50, 6)
    expect(log).toEqual(['paused', 'after'])
  })
})

describe('tween callbacks inside a timeline', () => {
  it('runs onStart, onUpdate and onComplete for each tween at its own times', async () => {
    live
      .timeline()
      .to('#a', { x: 100, duration: 0.5, onStart: () => log.push('a start'), onComplete: () => log.push('a done') })
      .to('#b', { x: 100, duration: 0.5, onStart: () => log.push('b start'), onUpdate: () => log.push('b update'), onComplete: () => log.push('b done') })
    await play(300)
    expect(log).toEqual(['a start'])
    await play(800)
    const bUpdates = log.filter((entry) => entry === 'b update').length
    expect(log.filter((entry) => entry !== 'b update')).toEqual(['a start', 'a done', 'b start', 'b done'])
    expect(bUpdates).toBeGreaterThan(5)
  })

  it('runs a single tween’s callbacks once', async () => {
    live.to('#a', { x: 100, duration: 0.3, onStart: () => log.push('start'), onComplete: () => log.push('done') })
    await play(500)
    expect(log).toEqual(['start', 'done'])
  })
})

describe('completion', () => {
  it('calls onReverseComplete, not onComplete, on arriving back at the start', async () => {
    const tl = live.timeline({ onComplete: () => log.push('complete'), onReverseComplete: () => log.push('reverse complete') }).to('#a', { x: 100, duration: 0.5 })
    await play(600)
    expect(log).toEqual(['complete'])
    tl.reverse()
    frames.advance(50, 12)
    expect(log).toEqual(['complete', 'reverse complete'])
  })

  it('calls onRepeat on single tweens', async () => {
    live.to('#a', { x: 100, duration: 0.2, repeat: 2, onRepeat: () => log.push('repeat'), onComplete: () => log.push('done') })
    await play(700)
    expect(log).toEqual(['repeat', 'repeat', 'done'])
  })

  it('waits out repeatDelay without firing the next loop early', async () => {
    live.timeline({ repeat: 1, repeatDelay: 0.5 }).to('#a', { x: 100, duration: 0.2 }).call(() => log.push('start'), [], 0)
    await play(100)
    expect(log).toEqual(['start'])
    await play(500) // 0.2s of play, then waiting
    expect(log).toEqual(['start'])
    await play(300)
    expect(log).toEqual(['start', 'start'])
  })
})

describe('tweenTo', () => {
  it('pauses and animates the playhead to a label, firing callbacks on the way', async () => {
    const tl = live
      .timeline({ paused: true })
      .to('#a', { x: 100, duration: 1, ease: 'none' })
      .addLabel('middle', 0.5)
      .call(() => log.push('quarter'), [], 0.25)
      .to('#a', { x: 200, duration: 1, ease: 'none' })
    const done: string[] = []
    tl.tweenTo('middle', { duration: 0.4, onComplete: () => done.push('arrived') })
    await play(200)
    expect(tl.progress()).toBeGreaterThan(0)
    expect(tl.progress()).toBeLessThan(0.25)
    await play(300)
    expect(tl.progress()).toBeCloseTo(0.25)
    expect(log).toEqual(['quarter'])
    expect(done).toEqual(['arrived'])
    expect(tl.isActive()).toBe(false)

    tl.tweenFromTo(2, 1, { duration: 0.2 })
    await play(300)
    expect(tl.progress()).toBeCloseTo(0.5)
  })
})

describe('delayedCall and killTweensOf', () => {
  it('runs a delayed call once, and not after kill()', async () => {
    live.delayedCall(0.3, (word: string) => log.push(word), ['later'])
    const cancelled = live.delayedCall(0.3, () => log.push('cancelled'))
    cancelled.kill()
    await play(200)
    expect(log).toEqual([])
    await play(200)
    expect(log).toEqual(['later'])
  })

  it('stops tweens on a target, optionally only some properties, leaving others running', async () => {
    live.to('#a', { x: 100, y: 100, duration: 1, ease: 'none' })
    live.to('#b', { x: 100, duration: 1, ease: 'none' })
    await play(500)
    live.killTweensOf('#a', 'x')
    await play(600)
    const a = document.getElementById('a')!.style.transform
    const b = document.getElementById('b')!.style.transform
    expect(a).toBe('translateX(50px) translateY(100px)')
    expect(b).toContain('100px')

    live.to('#a', { rotate: 90, duration: 1 })
    await play(200)
    live.killTweensOf('#a')
    const before = document.getElementById('a')!.style.transform
    await play(400)
    expect(document.getElementById('a')!.style.transform).toBe(before)
  })
})

describe('random values and repeatRefresh', () => {
  it('draws "random(…)" values per element, the same on every page load', async () => {
    document.body.innerHTML = '<i class="dot"></i><i class="dot"></i><i class="dot"></i>'
    const build = () => {
      const api = createLive(new Stage({ scheduler: manualScheduler().scheduler }))
      const tl = api.to('.dot', { x: 'random(-100, 100, 1)', duration: 1, paused: true })
      return tl.toDefinition().tracks.map((track) => ('keyframes' in track ? track.keyframes[track.keyframes.length - 1].value : undefined))
    }
    const first = build()
    expect(first).toHaveLength(3)
    expect(new Set(first).size).toBeGreaterThan(1)
    expect(build()).toEqual(first)
  })

  it('draws new values on each loop with repeatRefresh', async () => {
    const object = { x: 0 }
    const destinations: unknown[] = []
    const destination = () => {
      const [track] = tl.toDefinition().tracks
      return 'keyframes' in track ? track.keyframes[track.keyframes.length - 1].value : undefined
    }
    const tl = live
      .timeline({ repeat: 3, repeatRefresh: true, onRepeat: () => destinations.push(destination()) })
      .to(object, { x: () => live.utils.random(0, 1000, 1), duration: 0.2, ease: 'none' })
    destinations.push(destination())
    await play(1000)
    expect(destinations).toHaveLength(4)
    expect(new Set(destinations).size).toBe(4)
  })

  it('getProperty reads what tinyfly applied, or an object’s own value', async () => {
    const object = { zoom: 2 }
    expect(live.getProperty(object, 'zoom')).toBe(2)
    live.to('#a', { x: 40, duration: 0.1 })
    await play(200)
    expect(live.getProperty('#a', 'x')).toBe(40)
    expect(live.getProperty('#b', 'opacity')).toBe(1)
  })
})
