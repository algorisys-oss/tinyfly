import { describe, it, expect } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { createRandom } from '../../engine/authoring/random'
import type { Track } from '../../engine/types'
import { ACTING_STYLES, actKeyframes, resolveActingStyle, type ActingStyleName } from './acting'
import { actCharacterTracks, actTracks } from './act-tracks'
import { STICK_ACTING_RIG } from './rigs'
import { GAGS, gag, gagDuration, type GagName } from './gags'
import { poseTracks, resolvePoseKeys, REST_POSE, type PoseKey } from '../stick-figure'
import { characterPoseTracks, type CharacterPoseKey } from '../character'

const valueAt = (tracks: Track[], field: string, time: number): number => {
  const timeline = new Timeline({ id: 't', tracks })
  return timeline.getStateAtTime(time).values.get('hero')?.get(field) as number
}
const track = (tracks: Track[], field: string) => tracks.find((t) => t.property === field)!
const values = (tracks: Track[], field: string) => track(tracks, field).keyframes.map((k) => k.value as number)

const WAVE: PoseKey[] = [
  { time: 0, pose: 'rest' },
  { time: 1000, pose: 'wave' },
  { time: 2500, pose: 'rest' },
]

describe('actTracks', () => {
  it('with style none, is poseTracks', () => {
    const plain = poseTracks('hero', WAVE)
    const acted = actTracks('hero', WAVE, { style: 'none' })
    for (const t of plain) {
      const a = track(acted, t.property)
      expect(a.keyframes.map((k) => [k.time, k.value]), t.property).toEqual(t.keyframes.map((k) => [k.time, k.value]))
    }
  })

  it('winds up the other way before a move, overshoots, then settles on the key', () => {
    const tracks = actTracks('hero', WAVE, { style: 'full' })
    const shoulder = values(tracks, 'rightShoulder')
    const rest = REST_POSE.rightShoulder
    const wave = 135
    // Dips below rest before rising, goes past the wave, then lands on it.
    expect(Math.min(...shoulder.slice(0, 4))).toBeLessThan(rest)
    expect(Math.max(...shoulder)).toBeGreaterThan(wave)
    const style = ACTING_STYLES.full
    const settled = 1000 + STICK_ACTING_RIG.depth.rightShoulder * style.overlap + style.settle
    expect(valueAt(tracks, 'rightShoulder', settled)).toBeCloseTo(wave)
    expect(valueAt(tracks, 'rightShoulder', 2500 + 400)).toBeCloseTo(rest)
  })

  it('overlaps: the body leads and the joints further out arrive later', () => {
    const keys: PoseKey[] = [
      { time: 0, pose: 'rest' },
      { time: 1000, pose: { lean: 10, rightShoulder: 90, rightElbow: 60, rightWrist: 30 } },
    ]
    const tracks = actTracks('hero', keys, { style: { base: 'full', anticipation: 0, overshoot: 0 } })
    const arrival = (field: string) => track(tracks, field).keyframes.at(-1)!.time
    expect(arrival('lean')).toBe(1000)
    expect(arrival('rightShoulder')).toBeGreaterThan(arrival('lean'))
    expect(arrival('rightElbow')).toBeGreaterThan(arrival('rightShoulder'))
    expect(arrival('rightWrist')).toBeGreaterThan(arrival('rightElbow'))
    // Half way, the wrist has done less of its move than the lean.
    const progress = (field: string, to: number) => (valueAt(tracks, field, 500) - REST_POSE[field as 'lean']) / (to - REST_POSE[field as 'lean'])
    expect(progress('rightWrist', 30)).toBeLessThan(progress('lean', 10))
  })

  it('moves the eyes ahead of the body, quickly', () => {
    const keys: PoseKey[] = [
      { time: 0, pose: 'rest' },
      { time: 1000, pose: { turn: 1, lookX: 1 } },
      { time: 2000, pose: { turn: 1, lookX: 1 } },
    ]
    const tracks = actTracks('hero', keys)
    const look = track(tracks, 'lookX').keyframes
    // Eyes there well before the body turns all the way.
    const eyesArrive = look.find((k) => k.value === 1)!.time
    expect(eyesArrive).toBeLessThan(500)
    expect(valueAt(tracks, 'turn', eyesArrive)).toBeLessThan(0.5)
  })

  it('blinks as the head turns, and not when the keys blink themselves', () => {
    const turning: PoseKey[] = [
      { time: 0, pose: 'rest' },
      { time: 800, pose: { turn: 0.8 } },
    ]
    const tracks = actTracks('hero', turning)
    expect(Math.max(...values(tracks, 'blink'))).toBe(1)
    const blinking: PoseKey[] = [...turning, { time: 1200, pose: { blink: 0.5 } }]
    expect(values(actTracks('hero', blinking), 'blink')).toEqual([0, 0, 0.5])
  })

  it('blinks now and then in a long hold', () => {
    const tracks = actTracks('hero', [{ time: 0, pose: 'rest' }, { time: 10000, pose: { lean: 4 } }])
    const closed = track(tracks, 'blink').keyframes.filter((k) => k.value === 1)
    expect(closed.length).toBeGreaterThanOrEqual(2)
  })

  it('drifts in a long hold instead of freezing, and still reaches the next key', () => {
    const keys: PoseKey[] = [
      { time: 0, pose: 'rest' },
      { time: 500, pose: { lean: 8 } },
      { time: 3000, pose: { lean: 8 } },
      { time: 3600, pose: { lean: 0 } },
    ]
    const tracks = actTracks('hero', keys)
    expect(valueAt(tracks, 'lean', 1000)).not.toBeCloseTo(valueAt(tracks, 'lean', 2900), 3)
    expect(valueAt(tracks, 'lean', 4500)).toBeCloseTo(0)
  })

  it('squashes before a jump, stretches in the air and squashes on landing', () => {
    const keys: PoseKey[] = [
      { time: 0, pose: 'rest' },
      { time: 600, pose: { rise: 0.3 } },
      { time: 1200, pose: { rise: 0 } },
      { time: 2000, pose: { rise: 0 } },
    ]
    const stretch = values(actTracks('hero', keys), 'stretch')
    expect(Math.min(...stretch)).toBeLessThan(1)
    expect(Math.max(...stretch)).toBeGreaterThan(1)
    expect(stretch.at(-1)).toBe(1)
    // A stretch the keys animate themselves is left alone.
    const authored = actTracks('hero', [...keys.slice(0, 2), { time: 1200, pose: { rise: 0, stretch: 0.9 } }])
    expect(values(authored, 'stretch')).not.toContain(1 + 0.14)
  })

  it('reaches every key pose once it settles, in every style', () => {
    const random = createRandom(7)
    const fields = ['lean', 'headTilt', 'rightShoulder', 'leftElbow', 'leftHip', 'turn', 'lookX'] as const
    for (const style of Object.keys(ACTING_STYLES) as ActingStyleName[]) {
      const keys: PoseKey[] = [{ time: 0, pose: 'rest' }]
      let time = 0
      for (let i = 0; i < 6; i++) {
        time += 300 + Math.round(random.next() * 1200)
        const change: Record<string, number> = {}
        for (const field of fields) if (random.next() < 0.5) change[field] = Math.round((random.next() - 0.5) * (field === 'turn' || field === 'lookX' ? 2 : 120))
        keys.push({ time, pose: change })
      }
      keys.push({ time: time + 2000, pose: {} })
      const tracks = actTracks('hero', keys, { style })
      for (const t of tracks) {
        const times = t.keyframes.map((k) => k.time)
        expect([...times].sort((a, b) => a - b), `${style} ${t.property} sorted`).toEqual(times)
        expect(new Set(times).size, `${style} ${t.property} distinct`).toBe(times.length)
      }
      const final = resolvePoseKeys(keys).at(-1)!
      for (const field of fields) expect(valueAt(tracks, field, time + 2000 + 1000) ?? REST_POSE[field], `${style} ${field}`).toBeCloseTo(final[field])
    }
  })

  it('is deterministic', () => {
    expect(actTracks('hero', WAVE, { style: 'snappy' })).toEqual(actTracks('hero', WAVE, { style: 'snappy' }))
    expect(JSON.parse(JSON.stringify(actTracks('hero', WAVE)))).toEqual(actTracks('hero', WAVE))
  })

  it('takes keys marked act: false as written', () => {
    const keys: PoseKey[] = [
      { time: 0, pose: 'rest' },
      { time: 400, pose: { rightShoulder: 90 }, act: false },
    ]
    const frames = track(actTracks('hero', keys), 'rightShoulder').keyframes
    expect(frames.map((k) => [k.time, k.value])).toEqual([
      [0, REST_POSE.rightShoulder],
      [400, 90],
    ])
  })
})

describe('resolveActingStyle', () => {
  it('takes a name, or changes to a preset', () => {
    expect(resolveActingStyle(undefined)).toBe(ACTING_STYLES.full)
    expect(resolveActingStyle('snappy')).toBe(ACTING_STYLES.snappy)
    expect(resolveActingStyle({ base: 'limited', overlap: 99 })).toEqual({ ...ACTING_STYLES.limited, overlap: 99 })
  })
})

describe('actCharacterTracks', () => {
  it('acts a v2 character: same fields as characterPoseTracks, wound up and overlapped', () => {
    const keys: CharacterPoseKey[] = [
      { time: 0, pose: {} },
      { time: 1000, pose: { 'arm.right.spread': 100, 'arm.right.elbow': 60, lean: 10 } },
    ]
    const plain = characterPoseTracks('hero', keys).map((t) => t.property)
    const acted = actCharacterTracks('hero', keys)
    for (const field of plain) expect(acted.map((t) => t.property)).toContain(field)
    expect(Math.min(...values(acted, 'arm.right.spread'))).toBeLessThan(12)
    expect(track(acted, 'arm.right.elbow').keyframes.at(-1)!.time).toBeGreaterThan(track(acted, 'lean').keyframes.at(-1)!.time)
  })
})

describe('actKeyframes', () => {
  it('returns nothing for no keys and leaves unchanged fields out', () => {
    expect(actKeyframes([], STICK_ACTING_RIG)).toEqual({})
    const out = actKeyframes([{ time: 0, pose: { lean: 0, smile: 0 } }, { time: 500, pose: { lean: 5, smile: 0 } }], STICK_ACTING_RIG)
    expect(Object.keys(out)).toEqual(['lean'])
  })
})

describe('gags', () => {
  for (const name of Object.keys(GAGS) as GagName[]) {
    it(`${name}: timed keys from the pose it starts on`, () => {
      const keys = gag(name, { at: 500, from: 'point' })
      expect(keys[0].time).toBe(500)
      expect(keys.at(-1)!.time).toBe(500 + gagDuration(name))
      expect(keys.slice(1).every((key) => key.act === false)).toBe(true)
      const times = keys.map((key) => key.time)
      expect([...times].sort((a, b) => a - b)).toEqual(times)
      // It splices into acted keys, and the result is still in order.
      const story: PoseKey[] = [{ time: 0, pose: 'point' }, ...keys, { time: 500 + gagDuration(name) + 800, pose: 'rest' }]
      for (const t of actTracks('hero', story, { style: 'snappy' })) {
        const frames = t.keyframes.map((k) => k.time)
        expect([...frames].sort((a, b) => a - b), `${name} ${t.property}`).toEqual(frames)
      }
    })
  }

  it('scales with speed', () => {
    expect(gagDuration('take', 2)).toBe(gagDuration('take') * 2)
    expect(gag('take', { at: 0, speed: 2 }).at(-1)!.time).toBe(gagDuration('take', 2))
  })
})
