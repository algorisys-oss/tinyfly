// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { timeline } from './index'
import { springParameters, springVelocity } from './spring-vars'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'
import { SPRING_PRESETS, isSpringTrack, springDuration, springValueAt, type SpringTrack } from '../../engine'

describe('spring vars', () => {
  it('resolves true, preset names and options over a preset', () => {
    expect(springParameters(true)).toEqual({})
    expect(springParameters('wobbly')).toEqual(SPRING_PRESETS.wobbly)
    expect(springParameters({ preset: 'stiff', damping: 10 })).toEqual({ ...SPRING_PRESETS.stiff, damping: 10 })
    expect(() => springParameters('floppy' as never)).toThrow(/unknown spring preset "floppy"/)
  })

  it('reads one velocity for every property, or one per property', () => {
    expect(springVelocity({ velocity: 300 }, 'x')).toBe(300)
    expect(springVelocity({ velocity: { x: 800, y: -200 } }, 'y')).toBe(-200)
    expect(springVelocity({ velocity: { x: 800 } }, 'y')).toBeUndefined()
    expect(springVelocity('bouncy', 'x')).toBeUndefined()
  })
})

describe('spring tweens compile to spring tracks', () => {
  it('turns numeric properties into spring tracks and tweens the rest', () => {
    const tl = timeline()
    tl.fromTo('card', { x: 0, scale: 0.5, backgroundColor: '#000000' }, { x: 200, scale: 1, backgroundColor: '#ffffff', duration: 0.3, spring: 'bouncy' })
    const tracks = tl.timeline.tracks
    const springs = tracks.filter(isSpringTrack) as SpringTrack[]
    expect(springs.map((t) => t.property).sort()).toEqual(['scale', 'x'])
    expect(springs.find((t) => t.property === 'x')!.spring).toMatchObject({ from: 0, to: 200, velocity: 0, ...SPRING_PRESETS.bouncy })
    expect(tracks.find((t) => t.property === 'backgroundColor')).toBeDefined()
  })

  it('lasts as long as its slowest spring, ignoring duration when only springs are left', () => {
    const tl = timeline()
    const handle = tl.fromTo('card', { x: 0 }, { x: 100, duration: 5, spring: { stiffness: 300, damping: 30 } })
    const settle = springDuration({ from: 0, to: 100, stiffness: 300, damping: 30 })
    expect(handle.end - handle.start).toBe(settle)
    expect(tl.duration()).toBeCloseTo(settle / 1000)
  })

  it('chains: the next tween starts where the spring comes to rest, and it serializes', () => {
    const tl = timeline()
    tl.fromTo('card', { x: 0 }, { x: 100, spring: true })
    tl.to('card', { x: 50, duration: 0.5 })
    const second = tl.timeline.tracks.find((t) => !isSpringTrack(t) && t.property === 'x') as { keyframes: { value: number }[] }
    expect(second.keyframes[0].value).toBe(100)
    expect(JSON.parse(JSON.stringify(tl.toDefinition())).tracks[0].kind).toBe('spring')
  })

  it('from() springs from the given value to the current one', () => {
    const tl = timeline({ defaults: { y: 0 } })
    tl.from('card', { y: 80, spring: 'snappy' })
    const track = tl.timeline.tracks[0] as SpringTrack
    expect(track.spring).toMatchObject({ from: 80, to: 0 })
  })
})

describe('springs on live', () => {
  let live: LiveApi
  let pending: ((t: number) => void) | null = null
  let now = 0
  const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
  const frame = (ms: number) => {
    const cb = pending
    pending = null
    now += ms
    cb?.(now)
  }
  const flush = () => Promise.resolve()
  const x = () => Number(document.getElementById('box')!.style.transform.match(/translateX\(([-\d.]+)px/)?.[1] ?? 0)

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>'
    live = createLive(new Stage({ scheduler }))
  })

  it('plays the exact spring curve', async () => {
    live.fromTo('#box', { x: 0 }, { x: 100, spring: 'wobbly' })
    await flush()
    frame(0)
    frame(120)
    expect(x()).toBeCloseTo(springValueAt({ from: 0, to: 100, ...SPRING_PRESETS.wobbly }, 120), 5)
  })

  it('carries the momentum of the motion it interrupts', async () => {
    live.fromTo('#box', { x: 0 }, { x: 300, duration: 1, ease: 'none' }) // 300 px/s
    await flush()
    frame(0)
    frame(500)

    const retarget = live.to('#box', { x: 0, spring: 'default' })
    const track = retarget.timeline.tracks[0] as SpringTrack
    expect(track.spring.from).toBeCloseTo(150)
    expect(track.spring.velocity).toBeCloseTo(300, 0)
  })

  it('uses a given velocity over the running one (a drag release)', async () => {
    const tl = live.to('#box', { x: 0, spring: { velocity: { x: -900 } } })
    const track = tl.timeline.tracks[0] as SpringTrack
    expect(track.spring.velocity).toBe(-900)
  })

  it('starts still when nothing was moving the property', () => {
    const tl = live.to('#box', { x: 40, spring: true })
    expect((tl.timeline.tracks[0] as SpringTrack).spring.velocity).toBe(0)
  })
})
