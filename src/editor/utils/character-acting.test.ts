import { describe, it, expect } from 'vitest'
import type { Track } from '../../engine/types'
import { HUMAN_REST, gagDuration, humanPose, type CharacterPose } from '../../characters'
import { actingTracks, characterGagKeys, characterWalk, keyPosesOf, spliceKeys, stickTurnOf, upsertKey, withRemovals, type KeyPose } from './character-acting'

const rest: CharacterPose = { ...HUMAN_REST }
const key = (time: number, changes: CharacterPose): KeyPose => ({ time, pose: humanPose(changes) })

describe('keyPosesOf', () => {
  it('reads one whole pose per keyed time from a character’s tracks', () => {
    const tracks: Track[] = [
      { id: 'a', target: 'Hero', property: 'lean', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 10 }] },
      { id: 'b', target: 'Hero', property: 'arm.right.spread', keyframes: [{ time: 500, value: 90 }] },
      { id: 'c', target: 'Hero', property: 'x', keyframes: [{ time: 700, value: 50 }] },
      { id: 'd', target: 'Other', property: 'lean', keyframes: [{ time: 300, value: 4 }] },
    ]
    const keys = keyPosesOf(tracks, 'Hero', rest)
    expect(keys.map((k) => k.time)).toEqual([0, 500, 1000])
    expect(keys[1].pose.lean).toBeCloseTo(5)
    expect(keys[1].pose['arm.right.spread']).toBe(90)
    expect(keys[2].pose['turn']).toBe(rest.turn)
    expect(keyPosesOf([], 'Hero', rest)).toEqual([])
  })
})

describe('actingTracks', () => {
  const keys = [key(0, {}), key(800, { 'arm.right.spread': 120, lean: 8 }), key(1800, {})]

  it('writes the plain poses with style none, and acted ones otherwise', () => {
    const plain = actingTracks('Hero', { style: 'none', keys }, rest)
    expect(plain.find((t) => t.property === 'arm.right.spread')!.keyframes.map((k) => k.value as number)).toEqual([12, 120, 12])
    const acted = actingTracks('Hero', { style: 'snappy', keys }, rest)
    const arm = acted.find((t) => t.property === 'arm.right.spread')!.keyframes.map((k) => k.value as number)
    expect(Math.min(...arm)).toBeLessThan(12)
    expect(Math.max(...arm)).toBeGreaterThan(120)
    expect(acted.some((t) => t.property === 'blink')).toBe(false)
  })

  it('lip-syncs the lines over the mouth', () => {
    const tracks = actingTracks('Hero', { style: 'full', keys, lines: [{ text: 'mama mia', start: 900, end: 1600 }] }, rest)
    const mouth = tracks.find((t) => t.property === 'mouth')!.keyframes
    expect(mouth.some((k) => k.time > 900 && k.time < 1600 && (k.value as number) > 0.4)).toBe(true)
  })
})

describe('withRemovals', () => {
  it('adds an empty track for each character field no longer written', () => {
    const existing = [
      { target: 'Hero', property: 'blink', keyframes: [{ time: 0, value: 0 }] },
      { target: 'Hero', property: 'lean', keyframes: [{ time: 0, value: 0 }] },
      { target: 'Hero', property: 'x', keyframes: [{ time: 0, value: 0 }] },
    ] as Track[]
    const out = withRemovals(existing, 'Hero', [{ property: 'lean', keyframes: [{ time: 0, value: 3 }] }])
    expect(out).toEqual([{ property: 'lean', keyframes: [{ time: 0, value: 3 }] }, { property: 'blink', keyframes: [] }])
  })
})

describe('key lists', () => {
  it('splice in keys over the span they cover, and upsert a key at a time', () => {
    const keys = [key(0, {}), key(500, {}), key(1000, {}), key(2000, {})]
    expect(spliceKeys(keys, [key(400, { lean: 1 }), key(1200, { lean: 2 })]).map((k) => k.time)).toEqual([0, 400, 1200, 2000])
    expect(upsertKey(keys, 1000.4, humanPose({ lean: 9 })).find((k) => k.time === 1000.4)!.pose.lean).toBe(9)
    expect(upsertKey(keys, 1500, humanPose()).map((k) => k.time)).toEqual([0, 500, 1000, 1500, 2000])
  })
})

describe('stickTurnOf', () => {
  it('maps the character’s views onto the stick figure’s front-to-side turn', () => {
    expect(stickTurnOf(0)).toBe(0)
    expect(stickTurnOf(0.5)).toBe(0.5)
    expect(stickTurnOf(1)).toBe(1)
    expect(stickTurnOf(2)).toBe(1)
    expect(stickTurnOf(3)).toBe(1)
    expect(stickTurnOf(3.5)).toBe(0.5)
    expect(stickTurnOf(4)).toBe(0)
  })
})

describe('characterGagKeys', () => {
  it('a take: timed from the playhead, on the character’s own pose and view', () => {
    const pose = humanPose({ turn: 1, 'arm.left.spread': 30 })
    const keys = characterGagKeys('take', { start: 1000, pose })
    expect(keys[0].time).toBe(1000)
    expect(keys.at(-1)!.time).toBe(1000 + gagDuration('take'))
    expect(keys.slice(1).every((k) => k.act === false)).toBe(true)
    // The view is kept, and it leaves the ground and lands.
    expect(keys.every((k) => k.pose.turn === 1)).toBe(true)
    expect(Math.max(...keys.map((k) => k.pose.lift))).toBeGreaterThan(0.1)
    expect(keys.at(-1)!.pose.lift).toBe(0)
  })
})

describe('characterWalk', () => {
  it('walks the distance side-on, easing in and out, with an x track', () => {
    const walk = characterWalk('bouncy', { start: 500, distance: -300, height: 200, pose: humanPose(), x: 40 })
    expect(walk.x[0]).toMatchObject({ time: 500, value: 40 })
    expect(walk.x.at(-1)!.value).toBeCloseTo(-260)
    expect(walk.keys.at(-1)!.time).toBe(Math.round(walk.end))
    // Facing left (the Side (left) view) while it walks; legs swing mid-walk.
    const middle = walk.keys[Math.floor(walk.keys.length / 2)].pose
    expect(middle.turn).toBe(3)
    expect(walk.keys.some((k) => Math.abs(k.pose['leg.left.swing']) > 10)).toBe(true)
    expect(walk.keys.slice(1).every((k) => k.act === false)).toBe(true)
    const times = walk.keys.map((k) => k.time)
    expect([...times].sort((a, b) => a - b)).toEqual(times)
  })
})
