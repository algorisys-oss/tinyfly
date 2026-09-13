import { describe, it, expect } from 'vitest'
import { timeline } from './timeline'
import { compileMotionPath, reverseMotionPath } from './motion-path-vars'
import { deserializeTimeline, serializeTimeline, isMotionPathTrack, type MotionPathTrack } from '../../engine'

/** GSAP's motionPath option compiles to an ordinary, serializable motion-path track. */

const pathTrack = (tl: ReturnType<typeof timeline>): MotionPathTrack =>
  tl.timeline.tracks.find(isMotionPathTrack) as MotionPathTrack

describe('compileMotionPath', () => {
  it('accepts path data, points, or the full object', () => {
    expect(compileMotionPath('M0 0 L10 0').config.pathData).toBe('M0 0 L10 0')
    expect(compileMotionPath([{ x: 0, y: 0 }, { x: 10, y: 0 }]).config.pathData).toMatch(/^M0 0 C/)
    expect(compileMotionPath({ path: [{ x: 0, y: 0 }, { x: 10, y: 0 }], curviness: 0 }).config.pathData).toBe('M0 0 L10 0')
  })

  it('maps autoRotate, including a numeric offset', () => {
    expect(compileMotionPath({ path: 'M0 0 L1 0', autoRotate: true }).config).toMatchObject({ autoRotate: true })
    expect(compileMotionPath({ path: 'M0 0 L1 0', autoRotate: 90 }).config).toMatchObject({ autoRotate: true, rotateOffset: 90 })
    expect(compileMotionPath({ path: 'M0 0 L1 0', autoRotate: false }).config.autoRotate).toBeUndefined()
  })

  it('defaults start and end to the whole path', () => {
    expect(compileMotionPath('M0 0 L1 0')).toMatchObject({ start: 0, end: 1 })
    expect(compileMotionPath({ path: 'M0 0 L1 0', start: 0.2, end: 0.8 })).toMatchObject({ start: 0.2, end: 0.8 })
  })

  it('rejects selectors with a pointer to live.to()', () => {
    expect(() => compileMotionPath('#route')).toThrow(/live\.to\(\)/)
    expect(() => compileMotionPath({})).toThrow(/needs a path/)
  })

  it('reverses start and end', () => {
    expect(reverseMotionPath({ path: 'M0 0 L1 0', start: 0.2, end: 0.9 })).toMatchObject({ start: 0.9, end: 0.2 })
    expect(reverseMotionPath('M0 0 L1 0')).toMatchObject({ start: 1, end: 0 })
  })
})

describe('motionPath in tweens', () => {
  it('compiles to a motion-path track with eased progress keyframes', () => {
    const tl = timeline()
    tl.to('dot', { motionPath: { path: 'M0 0 L100 0', autoRotate: true }, duration: 2, ease: 'power2.inOut' })
    const track = pathTrack(tl)
    expect(track.target).toBe('dot')
    expect(track.motionPathConfig).toMatchObject({ pathData: 'M0 0 L100 0', autoRotate: true })
    expect(track.keyframes.map((k) => [k.time, k.value])).toEqual([[0, 0], [2000, 1]])
    expect(track.keyframes[1].easing).toBeDefined()
  })

  it('animates other properties alongside the path', () => {
    const tl = timeline()
    tl.to('dot', { motionPath: 'M0 0 L100 0', opacity: 0.5, duration: 1 })
    expect(tl.timeline.tracks.map((t) => t.property).sort()).toEqual(['motionPath', 'opacity'])
  })

  it('positions the target along the path over time', () => {
    const tl = timeline()
    tl.to('dot', { motionPath: 'M0 0 L100 0 L100 100', duration: 1, ease: 'none' })
    const at = (ms: number) => tl.timeline.getStateAtTime(ms).values.get('dot')!
    expect(at(250).get('motionPathX')).toBeCloseTo(50)
    expect(at(750).get('motionPathY')).toBeCloseTo(50)
  })

  it('travels a sub-range with start and end', () => {
    const tl = timeline()
    tl.to('dot', { motionPath: { path: 'M0 0 L100 0', start: 0.25, end: 0.75 }, duration: 1, ease: 'none' })
    expect(tl.timeline.getStateAtTime(0).values.get('dot')!.get('motionPathX')).toBeCloseTo(25)
    expect(tl.timeline.getStateAtTime(1000).values.get('dot')!.get('motionPathX')).toBeCloseTo(75)
  })

  it('from() travels the path backwards', () => {
    const tl = timeline()
    tl.from('dot', { motionPath: 'M0 0 L100 0', duration: 1 })
    expect(pathTrack(tl).keyframes.map((k) => k.value)).toEqual([1, 0])
  })

  it('fromTo() takes the path from the "to" vars', () => {
    const tl = timeline()
    tl.fromTo('dot', { opacity: 0 }, { opacity: 1, motionPath: 'M0 0 L10 0', duration: 1 })
    expect(pathTrack(tl).keyframes.map((k) => k.value)).toEqual([0, 1])
  })

  it('staggers several followers along one path', () => {
    const tl = timeline()
    tl.to(['a', 'b', 'c'], { motionPath: 'M0 0 L100 0', duration: 1, stagger: 0.2, ease: 'none' })
    const track = pathTrack(tl)
    expect(track.targets).toEqual(['a', 'b', 'c'])
    const state = tl.timeline.getStateAtTime(500).values
    expect(state.get('a')!.get('motionPathX')).toBeCloseTo(50)
    expect(state.get('b')!.get('motionPathX')).toBeCloseTo(30)
    expect(tl.duration()).toBeCloseTo(1.4)
  })

  it('bakes non-bezier eases into progress keyframes', () => {
    const tl = timeline({ bakeEases: true })
    tl.to('dot', { motionPath: 'M0 0 L100 0', duration: 1, ease: 'bounce.out' })
    expect(pathTrack(tl).keyframes.length).toBeGreaterThan(10)
  })

  it('round-trips through JSON', () => {
    const tl = timeline()
    tl.to('dot', { motionPath: { path: 'M0 0 L100 0', matrix: [1, 0, 0, 1, 10, 20] }, duration: 1, ease: 'none' })
    const restored = deserializeTimeline(JSON.parse(JSON.stringify(serializeTimeline(tl.timeline))))
    const values = restored.getStateAtTime(500).values.get('dot')!
    expect([values.get('motionPathX'), values.get('motionPathY')]).toEqual([60, 20])
  })
})
