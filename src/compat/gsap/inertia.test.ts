import { describe, it, expect } from 'vitest'
import { timeline } from './timeline'
import { compileInertiaProperty, resistanceToFriction } from './inertia-vars'
import { isInertiaTrack, inertiaDuration, type InertiaTrack } from '../../engine'

const throws = (tl: ReturnType<typeof timeline>) => tl.timeline.tracks.filter(isInertiaTrack) as InertiaTrack[]

describe('compileInertiaProperty', () => {
  it('accepts a bare velocity', () => {
    expect(compileInertiaProperty(10, 500)).toEqual({ from: 10, velocity: 500 })
  })

  it('maps bounds, snapping and resistance', () => {
    const config = compileInertiaProperty(0, { velocity: 500, min: 0, max: 300, end: 50, resistance: 200 })
    expect(config).toEqual({ from: 0, velocity: 500, min: 0, max: 300, end: 50, friction: resistanceToFriction(200) })
    expect(resistanceToFriction(100)).toBe(4)
  })

  it('prefers friction over resistance', () => {
    expect(compileInertiaProperty(0, { velocity: 1, friction: 9, resistance: 200 }).friction).toBe(9)
  })

  it('resolves an end function once, against the natural resting place', () => {
    const seen: number[] = []
    const config = compileInertiaProperty(0, { velocity: 800, end: (natural) => (seen.push(natural), Math.round(natural / 30) * 30) })
    expect(seen).toEqual([200])
    expect(config.end).toEqual([210])
    // The stored config is plain data.
    expect(JSON.parse(JSON.stringify(config))).toEqual(config)
  })

  it('rejects a missing velocity', () => {
    expect(() => compileInertiaProperty(0, {} as never)).toThrow(/velocity/)
  })
})

describe('inertia in timelines', () => {
  it('compiles one inertia track per property, from the current value', () => {
    const tl = timeline()
    tl.fromTo('card', { x: 40 }, { x: 40, duration: 0 })
    tl.to('card', { inertia: { x: { velocity: 600, end: 100 }, y: 200 } })
    const [x, y] = throws(tl)
    expect(x).toMatchObject({ property: 'x', inertia: { from: 40, velocity: 600, end: 100 } })
    expect(y).toMatchObject({ property: 'y', inertia: { from: 0, velocity: 200 } })
  })

  it('lasts as long as the throw, ignoring duration', () => {
    const tl = timeline()
    tl.to('card', { inertia: { x: 800 }, duration: 10 })
    expect(tl.duration()).toBeCloseTo(inertiaDuration({ from: 0, velocity: 800 }) / 1000)
  })

  it('places the next tween after the throw, starting from where it rests', () => {
    const tl = timeline()
    // A free throw would stop at 200; the 150 grid lands it on 150.
    tl.to('card', { inertia: { x: { velocity: 800, end: 150 } } })
    const handle = tl.to('card', { x: 0, duration: 0.5 })
    const settle = inertiaDuration({ from: 0, velocity: 800, end: 150 })
    expect(handle.start).toBeCloseTo(settle)
    const back = tl.timeline.tracks.find((t) => t.property === 'x' && !isInertiaTrack(t)) as { keyframes: { value: number }[] }
    expect(back.keyframes[0].value).toBe(150)
  })

  it('plays the throw on the timeline', () => {
    const tl = timeline()
    tl.to('card', { inertia: { x: { velocity: 1000, end: [0, 250] } } })
    const xAt = (ms: number) => tl.timeline.getStateAtTime(ms).values.get('card')?.get('x') as number
    expect(xAt(0)).toBe(0)
    expect(xAt(100)).toBeGreaterThan(0)
    expect(xAt(10_000)).toBe(250)
  })
})
