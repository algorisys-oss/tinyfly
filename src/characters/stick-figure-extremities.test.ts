import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { POSES, REST_POSE, drawStickFigure, pose, stickFigureJoints, type StickPose, type StickStyle } from './stick-figure'
import { HAND_SHAPES } from './hands/hand-rig'

/**
 * Wrists, ankles, foot turn-out, and the whole body spinning and rising:
 * the joints dancing and flips need.
 */

const H = 300

function pixels(figure: StickPose, style: StickStyle = {}): Uint8ClampedArray {
  const ctx = createCanvas(400, 500).getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.translate(200, 450)
  drawStickFigure(ctx, figure, { height: H, ...style })
  return ctx.getImageData(0, 0, 400, 500).data
}

const same = (a: Uint8ClampedArray, b: Uint8ClampedArray) => a.every((value, i) => value === b[i])

describe('wrists', () => {
  it('turn the hand: handAngle and fingertips follow the wrist bend', () => {
    const straight = stickFigureJoints(pose({ rightShoulder: 90, rightElbow: 0 }))
    const bent = stickFigureJoints(pose({ rightShoulder: 90, rightElbow: 0, rightWrist: 60 }))
    // An arm straight out to the right points along +x; bending the wrist outward turns the hand up.
    expect(straight.handAngle.right).toBeCloseTo(0, 1)
    expect(bent.handAngle.right).toBeCloseTo(straight.handAngle.right - Math.PI / 3, 1)
    expect(bent.fingertips.right.y).toBeLessThan(bent.hands.right.y)
    expect(straight.fingertips.right.y).toBeCloseTo(straight.hands.right.y, 0)
    // The wrist joint itself stays where the forearm ends.
    expect(bent.hands.right).toEqual(straight.hands.right)
  })

  it('mirror on the left side and with facing', () => {
    const right = stickFigureJoints(pose({ rightShoulder: 90, rightWrist: 40 }))
    const left = stickFigureJoints(pose({ leftShoulder: 90, leftWrist: 40 }))
    expect(left.fingertips.left.y).toBeCloseTo(right.fingertips.right.y)
    expect(left.fingertips.left.x).toBeCloseTo(-right.fingertips.right.x)
    const facingLeft = stickFigureJoints(pose({ rightShoulder: 90, rightWrist: 40 }), { facing: -1 })
    expect(facingLeft.fingertips.right.x).toBeCloseTo(-right.fingertips.right.x)
  })

  it('leave dot hands drawn exactly as before', () => {
    expect(same(pixels(REST_POSE), pixels({ ...REST_POSE, rightWrist: 50 }))).toBe(true)
  })

  it('draw cartoon hands when the style asks, turned by the wrist', () => {
    const style: StickStyle = { hands: { right: HAND_SHAPES.point } }
    const dots = pixels(REST_POSE)
    const hands = pixels(REST_POSE, style)
    expect(same(dots, hands)).toBe(false)
    expect(same(hands, pixels({ ...REST_POSE, rightWrist: 50 }, style))).toBe(false)
  })
})

describe('ankles and turn-out', () => {
  it('rise onto tiptoe: pointing both toes lifts the body', () => {
    const flat = stickFigureJoints(REST_POSE)
    const tiptoe = stickFigureJoints(pose({ leftAnkle: 70, rightAnkle: 70 }))
    expect(tiptoe.hip.y).toBeLessThan(flat.hip.y - 0.03 * H)
    // The toes are the lowest point now, still on the ground.
    expect(tiptoe.toes.left.y).toBeCloseTo(0, 5)
  })

  it('flex onto the heel without lifting the body', () => {
    const flat = stickFigureJoints(REST_POSE)
    const heels = stickFigureJoints(pose({ leftAnkle: -40, rightAnkle: -40 }))
    // Only the slight toe drop of the resting foot is lost: the heel takes the weight.
    expect(Math.abs(heels.hip.y - flat.hip.y)).toBeLessThan(0.01 * H)
    expect(heels.toes.left.y).toBeLessThan(heels.feet.left.y)
  })

  it('turn the feet out and in', () => {
    const rest = stickFigureJoints(REST_POSE)
    const out = stickFigureJoints(pose({ leftFootOut: 0.3, rightFootOut: 0.3 }))
    const pigeon = stickFigureJoints(pose({ leftFootOut: -1, rightFootOut: -1 }))
    const reach = (j: typeof rest) => j.toes.right.x - j.feet.right.x
    expect(reach(out)).toBeGreaterThan(reach(rest))
    expect(reach(pigeon)).toBeLessThan(0)
  })

  it('leave the classic look alone', () => {
    const classic = { classic: true }
    expect(same(pixels(REST_POSE, classic), pixels({ ...REST_POSE, leftAnkle: 50, rightFootOut: 1 }, classic))).toBe(true)
  })
})

describe('full splits', () => {
  it('bring the hips down to the floor, legs flat along it', () => {
    for (const split of [POSES.sideSplit, POSES.frontSplit]) {
      const joints = stickFigureJoints(split)
      expect(joints.hip.y).toBeCloseTo(0, 5)
      expect(Math.abs(joints.feet.left.x - joints.feet.right.x)).toBeGreaterThan(0.8 * H)
      expect(joints.feetY).toBeCloseTo(0, 5)
    }
  })
})

describe('spin and rise', () => {
  it('turn the whole body about the hips', () => {
    const standing = stickFigureJoints(pose({ turn: 1 }))
    const upsideDown = stickFigureJoints(pose({ turn: 1, spin: 180 }))
    expect(upsideDown.hip.y).toBeCloseTo(standing.hip.y)
    // The head swings from above the hips to below them.
    expect(upsideDown.head.center.y).toBeGreaterThan(upsideDown.hip.y)
    expect(upsideDown.head.center.y - upsideDown.hip.y).toBeCloseTo(standing.hip.y - standing.head.center.y, 3)
    expect(upsideDown.head.angle).toBeCloseTo(Math.PI)
  })

  it('a full turn draws the same as none', () => {
    const figure = pose({ turn: 1, leftHip: -40 })
    const turned = stickFigureJoints({ ...figure, spin: 360 })
    const plain = stickFigureJoints(figure)
    expect(turned.head.center.x).toBeCloseTo(plain.head.center.x)
    expect(turned.head.center.y).toBeCloseTo(plain.head.center.y)
  })

  it('spin forward is the way the figure faces, mirrored when it faces left', () => {
    const right = stickFigureJoints(pose({ turn: 1, spin: 90 }))
    const left = stickFigureJoints(pose({ turn: 1, spin: 90 }), { facing: -1 })
    expect(right.head.center.x).toBeGreaterThan(0)
    expect(left.head.center.x).toBeCloseTo(-right.head.center.x)
  })

  it('rise lifts everything and lets go of the ground', () => {
    const standing = stickFigureJoints(REST_POSE)
    const up = stickFigureJoints(pose({ rise: 0.2 }))
    // Within a pixel: standing, the resting toe's slight drop lifts the hips a hair.
    expect(Math.abs(up.hip.y - (standing.hip.y - 0.2 * H))).toBeLessThan(1)
    expect(up.feetY).toBeCloseTo(-0.2 * H, 0)
    // Tucked in the air, the hips keep their height (planted, a tuck would drop them).
    const tuckGround = stickFigureJoints(pose({ leftHip: 100, rightHip: 100, leftKnee: 130, rightKnee: 130 }))
    const tuckAir = stickFigureJoints(pose({ leftHip: 100, rightHip: 100, leftKnee: 130, rightKnee: 130, rise: 0.2 }))
    expect(tuckAir.hip.y).toBeCloseTo(up.hip.y)
    expect(tuckGround.hip.y).toBeGreaterThan(standing.hip.y)
  })

  it('draws spun and lifted, and nothing changes at zero', () => {
    expect(same(pixels(REST_POSE), pixels({ ...REST_POSE, spin: 0, rise: 0 }))).toBe(true)
    expect(same(pixels(REST_POSE), pixels({ ...REST_POSE, spin: 90 }))).toBe(false)
  })
})
