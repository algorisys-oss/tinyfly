import { describe, it, expect } from 'vitest'
import type { Pose } from './rig/body-plan'
import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { character, characterJoints, drawCharacter } from './character'
import { HUMAN_POSES, HUMAN_REST, humanPose } from './species/human'
import { HAND_MEETINGS, embrace, embraceSpacing, helpUp, helpUpSpacing, meetHands, meetingSpacing, type HandMeeting } from './interactions'
import { HELD_ITEMS, handGrip, resolveHolding, type HeldItemName } from './hands/held-items'

/** How many pixels near `color` lie within `r` of (x, y). */
const pixelsOf = (canvas: Canvas, color: string, x: number, y: number, r: number) => {
  const [cr, cg, cb] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
  const data = canvas.getContext('2d').getImageData(Math.round(x - r), Math.round(y - r), r * 2, r * 2).data
  let count = 0
  for (let i = 0; i < data.length; i += 4) if (Math.abs(data[i] - cr) + Math.abs(data[i + 1] - cg) + Math.abs(data[i + 2] - cb) < 30) count++
  return count
}

describe('meetHands', () => {
  const a = character({ height: 300 })
  const b = character({ height: 260 })

  for (const kind of Object.keys(HAND_MEETINGS) as HandMeeting[]) {
    it(`${kind}: both hands reach one point when they stand the spacing apart`, () => {
      const xA = 100
      const xB = xA + meetingSpacing(kind, a, b)
      for (const view of ['threeQuarter', 'side'] as const) {
        const met = meetHands(kind, { character: a, x: xA }, { character: b, x: xB }, { view })
        expect(met.reached, view).toBe(true)
        const handA = characterJoints(a, met.a).points['hand.right']
        const handB = characterJoints(b, met.b).points['hand.right']
        const tolerance = kind === 'handOver' ? 0.2 * 260 : 0.03 * 260
        expect(Math.abs(handA.x + xA - (handB.x + xB))).toBeLessThan(tolerance)
        expect(Math.abs(handA.y - handB.y)).toBeLessThan(0.03 * 260 * 2)
        // a faces right, b faces left.
        expect(met.a.turn).toBeLessThan(1.5)
        expect(met.b.turn).toBeGreaterThan(2.5)
      }
    })
  }

  it('says when they stand too far apart to reach, and is the same either way round', () => {
    expect(meetHands('handshake', { character: a, x: 0 }, { character: b, x: 600 }).reached).toBe(false)
    const ab = meetHands('highFive', { character: a, x: 0 }, { character: b, x: 120 })
    const ba = meetHands('highFive', { character: b, x: 120 }, { character: a, x: 0 })
    expect(ba.a).toEqual(ab.b)
    expect(ba.b).toEqual(ab.a)
    expect(() => meetHands('hug' as never, { character: a, x: 0 }, { character: b, x: 100 })).toThrow(/unknown meeting/)
  })
})

describe('held items', () => {
  it('resolve to explicit data and check which hands an item takes', () => {
    expect(resolveHolding({ right: 'mug', both: { item: 'parcel', color: '#123456' } })).toEqual({ right: { item: 'mug', color: HELD_ITEMS.mug.color }, both: { item: 'parcel', color: '#123456' } })
    expect(() => resolveHolding({ both: 'mug' })).toThrow(/one hand/)
    expect(() => resolveHolding({ left: 'parcel' })).toThrow(/both hands/)
    expect(() => resolveHolding({ left: 'sword' as never })).toThrow(/unknown item/)
  })

  it('draw at the hand’s grip, and go when `held` drops below 0.5', () => {
    const who = character({ height: 300, holding: { right: 'mug' } })
    const pose = humanPose(HUMAN_POSES.drink)
    const grip = handGrip(characterJoints(who, pose), 'right')
    const draw = (p: typeof pose) => {
      const canvas = createCanvas(300, 340)
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
      ctx.translate(150, 320)
      drawCharacter(ctx, who, p)
      return canvas
    }
    const bare = draw({ ...pose, 'held.right': 0 })
    const holding = draw(pose)
    const mugAt = (canvas: Canvas) => pixelsOf(canvas, HELD_ITEMS.mug.color, 150 + grip.point.x, 320 + grip.point.y, 16)
    expect(mugAt(holding)).toBeGreaterThan(20)
    expect(mugAt(bare)).toBe(0)
  })

  it('a cane reaches the ground from a hanging hand and lifts with it', () => {
    const who = character({ height: 300, holding: { right: 'cane' } })
    const draw = (p: Pose) => {
      const canvas = createCanvas(300, 340)
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
      ctx.translate(150, 320)
      drawCharacter(ctx, who, p)
      return canvas
    }
    const standing = humanPose(HUMAN_POSES.cane)
    const grip = handGrip(characterJoints(who, standing), 'right')
    // The ferrule sits on the ground, a little ahead of the hand (the shaft leans 0.12 forward).
    const length = Math.min(0.56 * 300, Math.max(0.3 * 300, -grip.point.y))
    const tipX = grip.point.x + (0.12 / Math.hypot(0.12, 1)) * length
    expect(pixelsOf(draw(standing), HELD_ITEMS.cane.color, 150 + tipX, 320 - 2, 10)).toBeGreaterThan(4)
    // Raised overhead, the cane comes off the ground.
    const raised = humanPose({ ...HUMAN_POSES.cane, 'arm.right.spread': 150, 'arm.right.swing': 0 })
    expect(pixelsOf(draw(raised), HELD_ITEMS.cane.color, 150 + tipX, 320 - 2, 10)).toBe(0)
    expect(characterJoints(who, standing).groundY).toBeCloseTo(0, 6)
  })

  it('draw every item in every hand it takes, in every view', () => {
    for (const item of Object.keys(HELD_ITEMS) as HeldItemName[]) {
      const hands = HELD_ITEMS[item].hands
      const holding = hands === 'both' ? { both: item } : hands === 'either' ? { both: item, left: item } : { left: item, right: item }
      const who = character({ height: 200, holding })
      for (const turn of [0, 1, 2, 3]) {
        const ctx = createCanvas(200, 220).getContext('2d') as unknown as CanvasRenderingContext2D
        expect(() => drawCharacter(ctx, who, { ...HUMAN_REST, ...HUMAN_POSES.lift, turn })).not.toThrow()
      }
    }
  })
})

describe('everyday poses', () => {
  it('stand or sit on the ground in every view', () => {
    const who = character({ height: 300 })
    for (const name of ['sleep', 'stretch', 'sitFloor', 'carry', 'lift', 'push', 'pull', 'drink', 'phone', 'read', 'type'] as const) {
      for (const turn of [0, 1, 2, 3]) expect(characterJoints(who, { ...HUMAN_POSES[name], turn }).groundY, name).toBeCloseTo(0, 6)
    }
  })

  it('put the drinking hand up by the face', () => {
    const joints = characterJoints(character({ height: 300 }), { ...HUMAN_POSES.drink, turn: 1 })
    expect(joints.points['hand.right'].y).toBeLessThan(joints.points.neck.y)
  })
})

describe('embrace', () => {
  const a = character({ height: 300 })
  const b = character({ height: 260 })

  it('gets both pairs of arms round the other when they stand the spacing apart, in both views', () => {
    const xA = 200
    const xB = xA + embraceSpacing(a, b)
    for (const view of ['threeQuarter', 'side'] as const) {
      const hug = embrace({ character: a, x: xA }, { character: b, x: xB }, { view })
      expect(hug.reached, view).toBe(true)
      // a's right hand is over b's shoulder, near b's middle line; its left hand is at b's waist height.
      const handsA = characterJoints(a, hug.a).points
      expect(handsA['hand.right'].x + xA).toBeGreaterThan(xB - 0.08 * 260)
      expect(handsA['hand.right'].y).toBeLessThan(-0.65 * 260)
      expect(Math.abs(handsA['hand.left'].y + 0.5 * 260)).toBeLessThan(0.05 * 260)
      // They face each other, lean in and tilt their heads together.
      expect(hug.a.turn).toBeLessThan(1.5)
      expect(hug.b.turn).toBeGreaterThan(2.5)
      expect(hug.a.lean).toBeGreaterThan(5)
      expect(Math.sign(hug.a['head.tilt'])).toBe(-Math.sign(hug.b['head.tilt']))
    }
  })

  it('says when they stand too far apart, is the same either way round, and draws', () => {
    expect(embrace({ character: a, x: 0 }, { character: b, x: 400 }).reached).toBe(false)
    const ab = embrace({ character: a, x: 0 }, { character: b, x: 90 })
    const ba = embrace({ character: b, x: 90 }, { character: a, x: 0 })
    expect(ba.a).toEqual(ab.b)
    expect(ba.b).toEqual(ab.a)
    const canvas = createCanvas(400, 340)
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
    ctx.translate(150, 320)
    expect(() => drawCharacter(ctx, a, ab.a)).not.toThrow()
  })
})

describe('helpUp', () => {
  const helper = character({ height: 300 })
  const sitter = character({ height: 280 })
  const xH = 100
  const xS = xH + helpUpSpacing(helper, sitter)

  it('takes the hand on the floor, and both stand at the end, hands joined all the way', () => {
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const up = helpUp({ character: helper, x: xH }, { character: sitter, x: xS }, progress)
      expect(up.reached, `progress ${progress}`).toBe(true)
      const handH = characterJoints(helper, up.helper).points['hand.right']
      const handS = characterJoints(sitter, up.sitter).points['hand.right']
      expect(Math.abs(handH.x + xH - (handS.x + xS))).toBeLessThan(0.08 * 280)
      expect(Math.abs(handH.y - handS.y)).toBeLessThan(0.08 * 280)
    }
    const start = helpUp({ character: helper, x: xH }, { character: sitter, x: xS }, 0)
    const end = helpUp({ character: helper, x: xH }, { character: sitter, x: xS }, 1)
    // On the floor the sitter's head is low; standing, it is up; the helper bends down then straightens.
    expect(characterJoints(sitter, start.sitter).head.center.y).toBeGreaterThan(characterJoints(sitter, end.sitter).head.center.y + 0.2 * 280)
    expect(start.helper.lean).toBeGreaterThan(end.helper.lean + 15)
    expect(end.point.y).toBeLessThan(start.point.y)
    // The sitter faces the helper.
    expect(start.sitter.turn).toBeGreaterThan(2.5)
    expect(start.helper.turn).toBeLessThan(1.5)
  })
})
