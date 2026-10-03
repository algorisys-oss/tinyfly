import { describe, it, expect } from 'vitest'
import { HAND_REST, HAND_SHAPES, handJoints, handJointsAt, handPose, mixHandPoses, rotateAbout, type FingerJoints } from './hand-rig'

const tip = (finger: FingerJoints | undefined) => finger!.points[finger!.points.length - 1]
const tipDepth = (finger: FingerJoints | undefined) => finger!.depths[finger!.depths.length - 1]
/** Distance between two fingertips in 3D (screen plus depth). */
const gap = (a: FingerJoints | undefined, b: FingerJoints | undefined) =>
  Math.hypot(tip(a).x - tip(b).x, tip(a).y - tip(b).y, tipDepth(a) - tipDepth(b))

describe('hand rig', () => {
  it('is pure: the same pose and style give the same joints', () => {
    expect(handJoints(HAND_SHAPES.ok, { size: 120, angle: 20 })).toEqual(handJoints(HAND_SHAPES.ok, { size: 120, angle: 20 }))
  })

  it('points the fingers up from the wrist, the thumb to the left on a right hand seen from the back', () => {
    const hand = handJoints(HAND_SHAPES.open, { size: 100 })
    expect(tip(hand.fingers.middle).y).toBeLessThan(-90)
    expect(Math.abs(tip(hand.fingers.middle).x)).toBeLessThan(15)
    expect(tip(hand.fingers.thumb).x).toBeLessThan(tip(hand.fingers.pinky).x)
    expect(hand.palmFacing).toBeLessThan(-0.9) // the back faces us
  })

  it('mirrors a left hand', () => {
    const right = handJoints(HAND_SHAPES.point, { size: 100 })
    const left = handJoints(HAND_SHAPES.point, { size: 100, side: 'left' })
    expect(tip(left.fingers.thumb).x).toBeCloseTo(-tip(right.fingers.thumb).x)
    expect(tip(left.fingers.index).y).toBeCloseTo(tip(right.fingers.index).y)
  })

  it('turns: the palm faces the viewer at turn 2, the thumb side at turn 1', () => {
    expect(handJoints(handPose({ turn: 2 })).palmFacing).toBeGreaterThan(0.9)
    const side = handJoints(handPose({ turn: 1 }))
    expect(Math.abs(side.palmFacing)).toBeLessThan(0.05)
    const thumbDepth = tipDepth(side.fingers.thumb)
    expect(thumbDepth).toBeGreaterThan(tipDepth(side.fingers.pinky))
  })

  it('points the fingers along the angle, and scales with the size', () => {
    const hand = handJoints(HAND_SHAPES.flat, { size: 200, angle: 90 })
    expect(tip(hand.fingers.middle).x).toBeGreaterThan(180)
    expect(Math.abs(tip(hand.fingers.middle).y)).toBeLessThan(30)
  })

  it('curls fingers toward the palm: a fist is far shorter than an open hand', () => {
    const open = handJoints(HAND_SHAPES.open)
    const fist = handJoints(HAND_SHAPES.fist)
    expect(-tip(fist.fingers.middle).y).toBeLessThan(-tip(open.fingers.middle).y * 0.6)
    // Curled from the back, the fingertips are behind the knuckles.
    expect(tipDepth(fist.fingers.middle)).toBeLessThan(fist.fingers.middle!.depths[0])
  })

  it('closes the ring in ok and pinch, and points only the index finger', () => {
    for (const name of ['ok', 'pinch'] as const) {
      const hand = handJoints(HAND_SHAPES[name])
      expect(gap(hand.fingers.thumb, hand.fingers.index)).toBeLessThan(hand.fingers.index!.widths[0])
    }
    const point = handJoints(HAND_SHAPES.point)
    expect(-tip(point.fingers.index).y).toBeGreaterThan(-tip(point.fingers.middle).y + 30)
  })

  it('draws three fingers and a thumb when asked for four', () => {
    const hand = handJoints(HAND_REST, { fingers: 4 })
    expect(Object.keys(hand.fingers).sort()).toEqual(['index', 'middle', 'pinky', 'thumb'])
  })

  it('blends poses field by field', () => {
    const half = mixHandPoses(HAND_SHAPES.open, HAND_SHAPES.fist, 0.5)
    expect(half['index.curl']).toBeCloseTo(0.5)
    expect(half.turn).toBe(0)
  })

  it('moves joints so the wrist is at a point', () => {
    const moved = handJointsAt(handJoints(HAND_REST), { x: 50, y: 70 })
    expect(moved.wrist).toEqual({ x: 50, y: 70 })
    expect(tip(moved.fingers.middle).y).toBeCloseTo(tip(handJoints(HAND_REST).fingers.middle).y + 70)
  })

  it('rotates about an axis right-handedly', () => {
    const v = rotateAbout([0, 1, 0], [1, 0, 0], Math.PI / 2)
    expect(v[1]).toBeCloseTo(0)
    expect(v[2]).toBeCloseTo(1)
  })
})

describe('characters with cartoon hands', () => {
  it('reads each hand from its hand.<side>.* fields, turned to hang thumb forward', async () => {
    const { characterHandPose } = await import('../character')
    const right = characterHandPose({ turn: 0, 'hand.right.index.curl': 1, 'hand.left.index.curl': 0.5 }, 'right')
    expect(right['index.curl']).toBe(1)
    expect(right.turn).toBe(1) // seen from the front, a hanging hand shows its thumb side
    expect(characterHandPose({ turn: 1 }, 'right').turn).toBe(0) // in profile, the near hand shows its back
    expect(characterHandPose({ turn: 0, 'hand.left.turn': 1 }, 'left').turn).toBe(2)
  })

  it('draws gloves on the fluid figure only when asked', async () => {
    const { createCanvas } = await import('@napi-rs/canvas')
    const { character, drawCharacter } = await import('../character')
    const draw = (hands: 'dot' | 'cartoon') => {
      const ctx = createCanvas(300, 340).getContext('2d') as unknown as CanvasRenderingContext2D
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 300, 340)
      ctx.translate(150, 320)
      drawCharacter(ctx, character({ height: 300, hands, skin: '#00ff00' }), { turn: 0 })
      const data = ctx.getImageData(0, 150, 300, 150).data // the lower body, below the head
      let green = 0
      for (let i = 0; i < data.length; i += 4) if (data[i] < 40 && data[i + 1] > 200 && data[i + 2] < 40) green++
      return green
    }
    expect(draw('dot')).toBe(0)
    expect(draw('cartoon')).toBeGreaterThan(50)
  })
})
