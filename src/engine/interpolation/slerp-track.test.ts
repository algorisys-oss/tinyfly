import { describe, it, expect } from 'vitest'
import { Timeline } from '../core/timeline'
import { createTrack } from '../core/track'
import { expandParametricEasings } from '../core/bake'
import { serializeTimeline, deserializeTimeline, toJSON } from '../serialization/json'
import { quat, type Quat } from '../math'
import { FORMAT_VERSION, formatVersionFor, type Track } from '../types'

const yaw = (degrees: number) => quat.fromAxisAngle([0, 1, 0], degrees)
const angle = (q: number[]) => (2 * Math.acos(Math.min(1, Math.abs(q[3] / quat.length(q as Quat))))) * (180 / Math.PI)

function spin(interpolation?: 'slerp'): Track<number[]> {
  return createTrack<number[]>({
    id: 'spin',
    target: 'cube',
    property: 'quaternion',
    keyframes: [
      { time: 0, value: yaw(0) },
      { time: 1000, value: yaw(160) },
    ],
    ...(interpolation && { interpolation }),
  })
}

const valueAt = (track: Track<number[]>, time: number) =>
  new Timeline({ id: 't', tracks: [track] }).getStateAtTime(time).values.get('cube')!.get('quaternion') as number[]

describe("Track.interpolation: 'slerp'", () => {
  it('turns at a steady speed and keeps a unit quaternion', () => {
    const track = spin('slerp')
    for (const [time, degrees] of [[250, 40], [500, 80], [750, 120]]) {
      const q = valueAt(track, time)
      expect(quat.length(q as Quat)).toBeCloseTo(1, 12)
      expect(angle(q)).toBeCloseTo(degrees, 6)
    }
  })

  it('is what makes a 4-number array a rotation: without it the values lerp element-wise (and shrink)', () => {
    const lerped = valueAt(spin(), 500)
    expect(quat.length(lerped as Quat)).toBeCloseTo(Math.cos((40 * Math.PI) / 180), 9) // 0.77, not 1
  })

  it('eases the turn like any other track', () => {
    const eased = createTrack<number[]>({ ...spin('slerp'), keyframes: [{ time: 0, value: yaw(0) }, { time: 1000, value: yaw(160), easing: 'ease-in' }] })
    expect(angle(valueAt(eased, 500))).toBeLessThan(80)
  })

  it('bakes elastic and bounce eases along the arc', () => {
    const track = createTrack<number[]>({ ...spin('slerp'), keyframes: [{ time: 0, value: yaw(0) }, { time: 1000, value: yaw(160), easing: { type: 'elastic', mode: 'out' } }] })
    const baked = expandParametricEasings(track)
    expect(baked.keyframes.length).toBeGreaterThan(10)
    for (const key of baked.keyframes) expect(quat.length(key.value as Quat)).toBeCloseTo(1, 9)
  })
})

describe('format version', () => {
  it('reads up to version 2, and writes the lowest version a file needs', () => {
    expect(FORMAT_VERSION).toBe(2)
    expect(formatVersionFor([{}, {}])).toBe(1)
    expect(formatVersionFor([{}, { interpolation: 'slerp' }])).toBe(2)

    const plain = new Timeline({ id: 'p', tracks: [createTrack({ id: 'a', target: 'x', property: 'opacity', keyframes: [{ time: 0, value: 0 }] })] })
    expect(serializeTimeline(plain).formatVersion).toBe(1)
    expect(plain.toDefinition().formatVersion).toBe(1)

    const rotating = new Timeline({ id: 'r', tracks: [spin('slerp')] })
    expect(serializeTimeline(rotating).formatVersion).toBe(2)
    expect(rotating.toDefinition().formatVersion).toBe(2)
  })

  it('round-trips interpolation through JSON, and plain tracks gain no new field', () => {
    const json = toJSON(new Timeline({ id: 'r', tracks: [spin('slerp')] }))
    const back = deserializeTimeline(JSON.parse(json))
    expect((back.tracks[0] as Track).interpolation).toBe('slerp')
    expect(toJSON(new Timeline({ id: 'r', tracks: [spin()] }))).not.toContain('interpolation')
  })

  it('refuses a file from a newer format rather than playing it wrongly', () => {
    const definition = serializeTimeline(new Timeline({ id: 'r', tracks: [spin('slerp')] }))
    expect(() => deserializeTimeline({ ...definition, formatVersion: 3 })).toThrow(/format version 3/)
  })
})
