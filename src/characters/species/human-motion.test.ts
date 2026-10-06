import { describe, it, expect } from 'vitest'
import { character, characterJoints } from '../character'
import { GAITS, type GaitName } from '../gaits'
import { HUMAN_REST, humanPose } from './human'
import { HUMAN_GAGS, humanGag, humanGaitPose, humanGaitStrideLength, type HumanGagName } from './human-motion'

const who = character({ height: 200 })
const joints = (pose: Record<string, number>) => characterJoints(who, pose)
const GAITS_ = Object.keys(GAITS) as GaitName[]
const GAGS_ = Object.keys(HUMAN_GAGS) as HumanGagName[]

describe('bend (the human line of action)', () => {
  it('curves the back forward: the head turns further than the shoulders move', () => {
    const straight = joints(humanPose({ turn: 1 }))
    const bent = joints(humanPose({ turn: 1, bend: 30 }))
    const leaned = joints(humanPose({ turn: 1, lean: 30 }))
    // In profile (facing +x) the neck comes forward, but less than a lean of the same angle tips it.
    expect(bent.points.neck.x).toBeGreaterThan(straight.points.neck.x)
    expect(bent.points.neck.x).toBeLessThan(leaned.points.neck.x)
    // The hips stay put: it is the back that curves.
    expect(bent.points.hip.x).toBeCloseTo(straight.points.hip.x)
    // At 0 nothing changes.
    expect(joints(humanPose({ turn: 1, bend: 0 }))).toEqual(straight)
  })
})

describe('human gaits', () => {
  for (const gait of GAITS_) {
    it(`${gait}: cycles, and reads from every view`, () => {
      const at0 = humanGaitPose(gait, 0)
      const at1 = humanGaitPose(gait, 1)
      for (const field of Object.keys(at0)) expect(at1[field], field).toBeCloseTo(at0[field])
      // Seen from the other side (turn 3 against 1), the same pose is its mirror image, limb for limb.
      for (const phase of [0.1, 0.3, 0.6]) {
        const right = joints(humanGaitPose(gait, phase, humanPose({ turn: 1 })))
        const left = joints(humanGaitPose(gait, phase, humanPose({ turn: 3 })))
        for (const [name, p] of Object.entries(right.points)) {
          expect(Math.abs(-p.x - left.points[name].x) + Math.abs(p.y - left.points[name].y), `${gait} ${phase} ${name}`).toBeLessThan(1)
        }
        // The toes point the way it walks (or straight down, on tiptoe).
        expect(right.points['toe.left'].x - right.points['ankle.left'].x, `${gait} toes`).toBeGreaterThan(-0.01 * 200)
      }
      // At the contact pose the leading foot is out ahead of the hips, the way it faces.
      const contact = joints(humanGaitPose(gait, 0.25, humanPose({ turn: 1 })))
      expect(contact.points['ankle.left'].x, `${gait} leading foot`).toBeGreaterThan(contact.points.hip.x + 10)
      expect(humanGaitStrideLength(gait, 200)).toBeGreaterThan(0)
    })
  }

  it('give each gait its character, and keep raised arms raised', () => {
    expect(humanGaitPose('run', 0).lift).toBeGreaterThan(0.03)
    expect(humanGaitPose('sneak', 0.3)['leg.left.ankle']).toBeLessThan(-20)
    expect(joints(humanGaitPose('sneak', 0.25)).head.center.y).toBeGreaterThan(joints(humanGaitPose('walk', 0.25)).head.center.y)
    expect(humanGaitPose('tired', 0).bend).toBeGreaterThan(0)
    expect(humanGaitPose('strut', 0).bend).toBeLessThan(0)
    const waving = humanPose({ 'arm.right.spread': 115, 'arm.right.bend': 55 })
    expect(humanGaitPose('walk', 0.3, waving)['arm.right.spread']).toBe(115)
  })
})

describe('human gags', () => {
  for (const name of GAGS_) {
    it(`${name}: timed keys from the pose it starts on, in its view`, () => {
      for (const turn of [0, 1, 2, 3]) {
        const keys = humanGag(name, { at: 400, from: { turn } })
        expect(keys[0].time).toBe(400)
        expect(keys.slice(1).every((key) => key.act === false)).toBe(true)
        expect(keys.every((key) => key.pose.turn === turn)).toBe(true)
        const times = keys.map((key) => key.time)
        expect([...times].sort((a, b) => a - b)).toEqual(times)
        for (const key of keys) {
          const j = joints(key.pose)
          expect(j.head.center.y, `${name} ${turn}: head above hips`).toBeLessThan(j.points.hip.y)
          for (const p of Object.values(j.points)) expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true)
        }
      }
    })
  }

  it('a take flings the arms up in every view, and lands', () => {
    for (const turn of [0, 1, 2, 3]) {
      const keys = humanGag('take', { at: 0, from: { turn } })
      const apex = keys.reduce((a, b) => ((b.pose.lift ?? 0) > (a.pose.lift ?? 0) ? b : a))
      const j = joints(apex.pose)
      expect(j.points['hand.left'].y).toBeLessThan(j.points.neck.y)
      expect(j.points['hand.right'].y).toBeLessThan(j.points.neck.y)
      expect(keys.at(-1)!.pose.lift).toBe(0)
    }
  })

  it('speed stretches it, and the first key is the pose it starts from', () => {
    const from = { turn: 1, 'arm.left.spread': 30 }
    const keys = humanGag('deflate', { at: 0, from, speed: 2 })
    expect(keys[0].pose).toEqual({ ...HUMAN_REST, ...from })
    expect(keys.at(-1)!.time).toBe(1800)
  })
})
