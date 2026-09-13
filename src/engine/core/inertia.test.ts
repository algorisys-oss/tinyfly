import { describe, it, expect } from 'vitest'
import {
  inertiaValueAt,
  inertiaDuration,
  inertiaRest,
  naturalRest,
  inertiaVelocityAt,
  DEFAULT_INERTIA_FRICTION,
} from './inertia'
import { Timeline } from './timeline'
import { bakeInertiaTrack, toKeyframedTracks } from './bake'
import { serializeTimeline, deserializeTimeline } from '../serialization'
import type { InertiaConfig, InertiaTrack } from '../types'

const close = (actual: number, expected: number, tolerance = 1e-6) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)

describe('inertia motion', () => {
  const throwRight: InertiaConfig = { from: 0, velocity: 800 } // friction 4 → natural rest 200

  it('starts at from, moving at the release velocity', () => {
    expect(inertiaValueAt(throwRight, 0)).toBe(0)
    close(inertiaVelocityAt(throwRight, 0), 800)
  })

  it('comes to rest where friction stops a free throw', () => {
    expect(naturalRest(throwRight)).toBe(200)
    expect(inertiaRest(throwRight)).toBe(200)
    expect(inertiaValueAt(throwRight, inertiaDuration(throwRight))).toBe(200)
    expect(inertiaValueAt(throwRight, 1e9)).toBe(200)
  })

  it('follows the closed form in between', () => {
    close(inertiaValueAt(throwRight, 250), 200 * (1 - Math.exp(-DEFAULT_INERTIA_FRICTION * 0.25)))
  })

  it('only ever slows down, never reversing', () => {
    let previous = 0
    let previousSpeed = Infinity
    for (let t = 0; t <= inertiaDuration(throwRight); t += 16) {
      const value = inertiaValueAt(throwRight, t)
      const speed = inertiaVelocityAt(throwRight, t)
      expect(value).toBeGreaterThanOrEqual(previous)
      expect(speed).toBeLessThanOrEqual(previousSpeed)
      previous = value
      previousSpeed = speed
    }
  })

  it('throws the other way with a negative velocity', () => {
    expect(inertiaRest({ from: 100, velocity: -400 })).toBe(0)
  })

  it('travels less, over the same settle time, with more friction', () => {
    const loose = { from: 0, velocity: 800, friction: 2 }
    const tight = { from: 0, velocity: 800, friction: 8 }
    expect(inertiaRest(loose)).toBeGreaterThan(inertiaRest(tight))
    expect(inertiaDuration(loose)).toBeGreaterThan(inertiaDuration(tight))
  })

  it('settles in the same time regardless of distance or units', () => {
    close(inertiaDuration({ from: 0, velocity: 4000 }), inertiaDuration({ from: 0, velocity: 4 }), 1e-6)
  })

  it('is exactly reproducible at any time, in any order', () => {
    const times = [900, 16, 450, 16, 900]
    const values = times.map((t) => inertiaValueAt(throwRight, t))
    expect(values[1]).toBe(values[3])
    expect(values[0]).toBe(values[4])
  })

  it('does not move when there is nowhere to go', () => {
    expect(inertiaDuration({ from: 5, velocity: 0 })).toBe(0)
    expect(inertiaValueAt({ from: 5, velocity: 0 }, 300)).toBe(5)
  })
})

describe('snapping and bounds', () => {
  it('snaps to a grid increment, landing exactly on it', () => {
    const config = { from: 0, velocity: 700, end: 100 } // natural rest 175 → 200
    expect(inertiaRest(config)).toBe(200)
    expect(inertiaValueAt(config, inertiaDuration(config))).toBe(200)
  })

  it('snaps to the nearest listed value', () => {
    expect(inertiaRest({ from: 0, velocity: 700, end: [0, 150, 400] })).toBe(150)
  })

  it('keeps the friction feel when aiming at a snap', () => {
    // Same decay rate either way: the fraction of the journey covered by 250ms matches.
    const free = { from: 0, velocity: 700 }
    const snapped = { from: 0, velocity: 700, end: 100 }
    close(inertiaValueAt(free, 250) / inertiaRest(free), inertiaValueAt(snapped, 250) / inertiaRest(snapped), 1e-9)
  })

  it('settles back to a snap point even with no velocity', () => {
    const config = { from: 130, velocity: 0, end: 100 }
    expect(inertiaRest(config)).toBe(100)
    expect(inertiaDuration(config)).toBeGreaterThan(0)
  })

  it('keeps the rest inside min and max, after snapping', () => {
    expect(inertiaRest({ from: 0, velocity: 4000, max: 300 })).toBe(300)
    expect(inertiaRest({ from: 0, velocity: -4000, min: -50 })).toBe(-50)
    expect(inertiaRest({ from: 0, velocity: 1000, end: 200, max: 150 })).toBe(150)
  })

  it('ignores a non-positive increment and an empty list', () => {
    expect(inertiaRest({ from: 0, velocity: 700, end: 0 })).toBe(175)
    expect(inertiaRest({ from: 0, velocity: 700, end: [] })).toBe(175)
  })
})

describe('inertia tracks on a timeline', () => {
  const track = (extra: Partial<InertiaTrack> = {}): InertiaTrack => ({
    id: 'throw',
    target: 'card',
    property: 'x',
    kind: 'inertia',
    inertia: { from: 0, velocity: 1200, end: [0, 150, 300] },
    ...extra,
  })
  const xAt = (tl: Timeline, ms: number) => tl.getStateAtTime(ms).values.get('card')?.get('x')

  it('evaluates the throw and reports its duration', () => {
    const tl = new Timeline({ id: 't', tracks: [track()] })
    expect(xAt(tl, 0)).toBe(0)
    expect(xAt(tl, 5000)).toBe(300)
    close(tl.duration, inertiaDuration(track().inertia), 1e-9)
  })

  it('holds its start value until a delayed release', () => {
    const tl = new Timeline({ id: 't', tracks: [track({ delay: 500 })] })
    expect(xAt(tl, 400)).toBe(0)
    expect(xAt(tl, 700)).toBeGreaterThan(0)
    expect(tl.getTrackSpan('throw')?.from).toBe(500)
  })

  it('staggers several targets', () => {
    const tl = new Timeline({ id: 't', tracks: [track({ target: 'a', targets: ['a', 'b'], stagger: { each: 300 } })] })
    const state = tl.getStateAtTime(200).values
    expect(state.get('a')?.get('x')).toBeGreaterThan(0)
    expect(state.get('b')?.get('x')).toBe(0)
  })

  it('round-trips through JSON without sharing the snap list', () => {
    const original = track()
    const tl = new Timeline({ id: 't', tracks: [original] })
    const json = JSON.parse(JSON.stringify(serializeTimeline(tl)))
    expect(json.tracks[0]).toMatchObject({ kind: 'inertia', inertia: { from: 0, velocity: 1200, end: [0, 150, 300] } })
    const restored = deserializeTimeline(json)
    for (const ms of [0, 100, 400, 2000]) expect(xAt(restored, ms)).toBe(xAt(tl, ms))
    expect((serializeTimeline(tl).tracks[0] as InertiaTrack).inertia.end).not.toBe(original.inertia.end)
  })

  it('bakes to keyframes that land exactly on the rest value', () => {
    const baked = bakeInertiaTrack(track({ delay: 100 }))
    expect(baked.keyframes[0]).toMatchObject({ time: 0, value: 0 })
    expect(baked.keyframes[baked.keyframes.length - 1].value).toBe(300)
    expect(toKeyframedTracks([track()])).toHaveLength(1)
  })

  it('refuses to bake something that is not an inertia track', () => {
    expect(() => bakeInertiaTrack({ id: 'k', target: 'a', property: 'x', keyframes: [] })).toThrow(/not an inertia track/)
  })
})
