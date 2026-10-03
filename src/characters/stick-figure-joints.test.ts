import { describe, it, expect } from 'vitest'
import {
  POSES,
  REST_POSE,
  blendPose,
  drawStickFigure,
  headPoint,
  jointsToScene,
  pose,
  poseTracks,
  resolveStickPose,
  stickFigureAt,
  stickFigureJoints,
  stickFigureTarget,
  seatHeight,
  walkPose,
  type FigureLayers,
  type StickFigureProps,
  type StickJoints,
  type StickPose,
  type StickStyle,
} from './stick-figure'
import type { Point } from '../adapters/canvas/sketch'
import { CanvasAdapter } from '../adapters/canvas'
import { deserializeTimeline } from '../engine/serialization'
import type { TimelineDefinition } from '../engine/types'

/** A 2D affine matrix [a, b, c, d, e, f], as canvas uses. */
type Matrix = [number, number, number, number, number, number]

const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
]

interface Stroke {
  kind: 'stroke' | 'fill'
  points: Point[]
  ellipses: Point[]
}

/**
 * A context that records, in device coordinates, the points of every stroked
 * or filled path, and the order in which they and hook calls happen. Methods
 * it does not know are no-ops, so the canvas adapter can drive it too.
 */
function recordingContext() {
  let matrix: Matrix = [1, 0, 0, 1, 0, 0]
  const stack: Matrix[] = []
  let path: Stroke = { kind: 'stroke', points: [], ellipses: [] }
  const strokes: Stroke[] = []
  const log: string[] = []
  const apply = (x: number, y: number): Point => ({
    x: matrix[0] * x + matrix[2] * y + matrix[4],
    y: matrix[1] * x + matrix[3] * y + matrix[5],
  })
  const methods = {
    save: () => stack.push(matrix),
    restore: () => {
      matrix = stack.pop() ?? matrix
    },
    translate: (x: number, y: number) => (matrix = multiply(matrix, [1, 0, 0, 1, x, y])),
    scale: (x: number, y: number) => (matrix = multiply(matrix, [x, 0, 0, y, 0, 0])),
    rotate: (a: number) => (matrix = multiply(matrix, [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0])),
    setTransform: (a: number, b: number, c: number, d: number, e: number, f: number) => (matrix = [a, b, c, d, e, f]),
    beginPath: () => (path = { kind: 'stroke', points: [], ellipses: [] }),
    moveTo: (x: number, y: number) => path.points.push(apply(x, y)),
    lineTo: (x: number, y: number) => path.points.push(apply(x, y)),
    ellipse: (x: number, y: number) => path.ellipses.push(apply(x, y)),
    stroke: () => {
      strokes.push({ ...path, kind: 'stroke' })
      log.push('stroke')
    },
    fill: () => {
      strokes.push({ ...path, kind: 'fill' })
      log.push('fill')
    },
  }
  const store: Record<string | symbol, unknown> = {}
  const ctx = new Proxy(store, {
    get: (_, key) => (key in methods ? methods[key as keyof typeof methods] : key in store ? store[key] : () => undefined),
    set: (_, key, value) => {
      store[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { ctx, strokes, log, matrix: () => matrix }
}

const expectPoint = (actual: Point, expected: Point) => {
  expect(actual.x).toBeCloseTo(expected.x, 2)
  expect(actual.y).toBeCloseTo(expected.y, 2)
}

const expectPoints = (actual: Point[], expected: Point[]) => {
  expect(actual.length).toBe(expected.length)
  actual.forEach((p, i) => expectPoint(p, expected[i]))
}

/** The centre line of a tapered shape: its outline runs up one side and back down the other. */
const centreLine = (outline: Point[]) => {
  const n = outline.length / 2
  return outline.slice(0, n).map((p, i) => ({ x: (p.x + outline[2 * n - 1 - i].x) / 2, y: (p.y + outline[2 * n - 1 - i].y) / 2 }))
}

/**
 * The figure's parts as drawn, as polylines: strokes in the classic look,
 * the centre lines of tapered shapes otherwise (where each leg is followed by
 * its foot; hands are circles, which record no points). A figure turned past
 * a quarter draws its back (left) arm before the torso.
 */
function drawnParts(strokes: Stroke[], classic: boolean, shoulders: boolean, turned = false) {
  const head = strokes.find((s) => s.kind === 'stroke' && s.ellipses.length > 0)!.ellipses[0]
  const parts = classic
    ? strokes.filter((s) => s.kind === 'stroke').map((s) => s.points)
    : strokes.filter((s) => s.kind === 'fill' && s.points.length >= 4).map((s) => centreLine(s.points))
  const [leftLeg, leftFoot, rightLeg, rightFoot] = classic ? [parts[0], undefined, parts[1], undefined] : parts
  // After the legs: the upper body, in drawing order.
  const upper = parts.slice(classic ? 2 : 4)
  const order = [...(turned ? ['leftArm'] : []), 'torso', ...(shoulders ? ['shoulderLine'] : []), ...(turned ? [] : ['leftArm']), 'rightArm']
  const named = Object.fromEntries(order.map((name, i) => [name, upper[i]]))
  return {
    leftLeg,
    rightLeg,
    leftFoot,
    rightFoot,
    head,
    torso: named.torso,
    leftArm: named.leftArm,
    rightArm: named.rightArm,
    shoulderLine: named.shoulderLine as Point[] | undefined,
  }
}

const CASES: Array<{ name: string; figure: StickPose; style: StickStyle }> = [
  { name: 'rest', figure: REST_POSE, style: {} },
  { name: 'wave facing left', figure: POSES.wave, style: { facing: -1 } },
  { name: 'stretched rubber', figure: POSES.jump, style: { rubber: 1 } },
  { name: 'squashed half-rubber, left', figure: POSES.crouch, style: { rubber: 0.5, facing: -1 } },
  { name: 'lean and head tilt', figure: { ...POSES.point, lean: 14, headTilt: -20, stretch: 1.2 }, style: {} },
  { name: 'lean left, rubber', figure: { ...walkPose(0.3, POSES.think), lean: -9, headTilt: 12 }, style: { facing: -1, rubber: 1 } },
  { name: 'shoulders', figure: { ...POSES.cheer, lean: 10 }, style: { shoulderWidth: 0.075, facing: -1 } },
  { name: 'seated', figure: { ...POSES.sit, lean: 6 }, style: { facing: -1, rubber: 0.5 } },
  { name: 'half turned, half seated', figure: pose({ turn: 0.6, sit: 0.4 }), style: { shoulderWidth: 0.06 } },
]

describe('stickFigureJoints', () => {
  for (const classic of [true, false]) {
    for (const { name, figure, style: base } of CASES) {
      it(`agrees with what is drawn (${classic ? 'classic' : 'organic'}): ${name}`, () => {
        const style = { height: 300, classic, ...base }
        const { ctx, strokes } = recordingContext()
        ctx.translate(200, 400)
        drawStickFigure(ctx, figure, style)
        const joints = jointsToScene(stickFigureJoints(figure, style), 200, 400)
        const drawn = drawnParts(strokes, classic, Boolean(style.shoulderWidth), (figure.turn ?? 0) > 0.25)

        expectPoints(drawn.leftLeg, joints.limbs.leftLeg)
        expectPoints(drawn.rightLeg, joints.limbs.rightLeg)
        expectPoints(drawn.leftArm, joints.limbs.leftArm)
        expectPoints(drawn.rightArm, joints.limbs.rightArm)
        expectPoints(drawn.torso, joints.limbs.spine)
        expectPoint(drawn.leftLeg[0], joints.hip)
        expectPoint(drawn.leftLeg.at(-1)!, joints.feet.left)
        expectPoint(drawn.rightLeg.at(-1)!, joints.feet.right)
        expectPoint(drawn.leftArm[0], joints.shoulders.left)
        expectPoint(drawn.leftArm.at(-1)!, joints.hands.left)
        expectPoint(drawn.rightArm.at(-1)!, joints.hands.right)
        expectPoint(drawn.torso.at(-1)!, joints.neck)
        expectPoint(drawn.head, joints.head.center)
        if (drawn.shoulderLine) {
          expectPoint(drawn.shoulderLine[0], joints.shoulders.left)
          expectPoint(drawn.shoulderLine.at(-1)!, joints.shoulders.right)
        }
        if (!classic) {
          expectPoints(drawn.leftFoot!, [joints.feet.left, joints.toes.left])
          expectPoints(drawn.rightFoot!, [joints.feet.right, joints.toes.right])
        }
      })
    }
  }

  it('stands the organic figure on the ground; the classic one keeps its hips fixed', () => {
    for (const figure of [REST_POSE, walkPose(0.25), walkPose(0.6), POSES.crouch]) {
      expect(stickFigureJoints(figure).feetY).toBeCloseTo(0)
    }
    // A wide stride lowers the hips: the walk bobs.
    expect(stickFigureJoints(walkPose(0.25)).hip.y).toBeGreaterThan(stickFigureJoints(walkPose(0)).hip.y)
    expect(stickFigureJoints(walkPose(0.25), { classic: true }).hip.y).toBe(stickFigureJoints(REST_POSE, { classic: true }).hip.y)
    expect(stickFigureJoints(walkPose(0.25), { classic: true }).feetY).toBeLessThan(-1)
  })

  it('mirrors for facing: facing left is the x-negated facing right', () => {
    const figure = { ...POSES.wave, lean: 12, headTilt: -8, stretch: 1.1 }
    const style = { rubber: 0.7, shoulderWidth: 0.05 }
    const right = stickFigureJoints(figure, style)
    const left = stickFigureJoints(figure, { ...style, facing: -1 })
    const flip = (p: Point) => ({ x: -p.x, y: p.y })
    for (const key of ['hip', 'neck'] as const) expectPoint(left[key], flip(right[key]))
    for (const key of ['shoulders', 'elbows', 'hands', 'knees', 'feet'] as const) {
      expectPoint(left[key].left, flip(right[key].left))
      expectPoint(left[key].right, flip(right[key].right))
    }
    expectPoints(left.limbs.rightArm, right.limbs.rightArm.map(flip))
    expectPoint(left.head.center, flip(right.head.center))
    expect(left.head.angle).toBeCloseTo(-right.head.angle)
    expect(left.head.faceX).toBeCloseTo(-right.head.faceX)
    // A direction mirrored across the vertical: θ becomes π − θ.
    expect(Math.cos(left.handAngle.right)).toBeCloseTo(-Math.cos(right.handAngle.right))
    expect(Math.sin(left.handAngle.right)).toBeCloseTo(Math.sin(right.handAngle.right))
  })

  it('points the hand along the forearm', () => {
    // An arm straight out to the right: the forearm points along +x.
    const joints = stickFigureJoints(pose({ rightShoulder: 90, rightElbow: 0 }))
    expect(joints.handAngle.right).toBeCloseTo(0)
    expect(joints.hands.right.x).toBeGreaterThan(joints.elbows.right.x)
  })

  it('places shoulders square to the leaning spine', () => {
    const joints = stickFigureJoints(pose({ lean: 30 }), { height: 100, shoulderWidth: 0.1 })
    const across = { x: joints.shoulders.right.x - joints.shoulders.left.x, y: joints.shoulders.right.y - joints.shoulders.left.y }
    const spine = { x: joints.neck.x - joints.hip.x, y: joints.neck.y - joints.hip.y }
    expect(Math.hypot(across.x, across.y)).toBeCloseTo(20)
    expect(across.x * spine.x + across.y * spine.y).toBeCloseTo(0)
    // Without a width both arms start at one point.
    const narrow = stickFigureJoints(REST_POSE)
    expectPoint(narrow.shoulders.left, narrow.shoulders.right)
  })

  it('locates face features on the head', () => {
    const joints = stickFigureJoints(REST_POSE, { height: 300 })
    const { head } = joints
    expect(head.browTopY).toBeLessThan(head.eyeY)
    expect(head.eyeY).toBeLessThan(head.mouthY)
    // Raised brows sit higher.
    expect(stickFigureJoints(pose({ leftBrow: 1 })).head.browTopY).toBeLessThan(head.browTopY)
    // Upright, head units are plain offsets from the centre.
    expectPoint(headPoint(head, 0, -1), { x: head.center.x, y: head.center.y - head.ry })
    // A tilted head turns the points with it.
    const tilted = stickFigureJoints(pose({ headTilt: 90 })).head
    expectPoint(headPoint(tilted, 0, -1), { x: tilted.center.x + tilted.ry, y: tilted.center.y })
  })
})

describe('sitting, turning and ground contact', () => {
  it('sits with the hips at the seat height and the feet on the ground', () => {
    for (const facing of [1, -1]) {
      const joints = stickFigureJoints(pose({ sit: 1 }), { height: 300, facing })
      expect(-joints.hip.y).toBeCloseTo(seatHeight(300))
      expect(joints.feetY).toBeCloseTo(0)
      // Thighs level and forward, the way the figure faces.
      expect(joints.knees.right.y).toBeCloseTo(joints.hip.y)
      expect(Math.sign(joints.knees.right.x - joints.hip.x)).toBe(facing)
      expect(joints.feet.left.x).toBeCloseTo(joints.knees.left.x)
    }
    expect(seatHeight(300, 1.2)).toBeCloseTo(1.2 * seatHeight(300))
  })

  it('keeps the lower foot on the ground while sitting down', () => {
    for (const sit of [0.25, 0.5, 0.8]) {
      expect(stickFigureJoints(pose({ sit }), { height: 300 }).feetY).toBeCloseTo(0)
    }
    // In the classic look (hips otherwise fixed) lowering is gradual: a little sit drops the hips a little.
    const standing = stickFigureJoints(REST_POSE, { height: 300, classic: true }).hip.y
    const slightly = stickFigureJoints(pose({ sit: 0.05 }), { height: 300, classic: true }).hip.y
    expect(slightly).toBeGreaterThan(standing)
    expect(slightly - standing).toBeLessThan(10)
  })

  it('turns the face toward the facing side and closes up the shoulders', () => {
    const front = stickFigureJoints(REST_POSE, { shoulderWidth: 0.1, height: 100 })
    const profile = stickFigureJoints(pose({ turn: 1 }), { shoulderWidth: 0.1, height: 100 })
    const leftProfile = stickFigureJoints(pose({ turn: 1 }), { shoulderWidth: 0.1, height: 100, facing: -1 })
    expect(profile.head.faceX).toBeGreaterThan(front.head.faceX)
    expect(leftProfile.head.faceX).toBeCloseTo(-profile.head.faceX)
    expect(front.shoulders.right.x - front.shoulders.left.x).toBeCloseTo(20)
    expect(profile.shoulders.right.x - profile.shoulders.left.x).toBeCloseTo(0)
    const half = stickFigureJoints(pose({ turn: 0.5 }), { shoulderWidth: 0.1, height: 100 })
    expect(half.shoulders.right.x - half.shoulders.left.x).toBeCloseTo(20 * Math.cos(Math.PI / 4))
  })

  it('turns the feet out from the front, and round to the facing side in profile', () => {
    for (const facing of [1, -1]) {
      const front = stickFigureJoints(REST_POSE, { facing })
      // Each foot points out to its own side of the body.
      expect(Math.sign(front.toes.left.x - front.feet.left.x)).toBe(Math.sign(front.feet.left.x))
      expect(Math.sign(front.toes.right.x - front.feet.right.x)).toBe(Math.sign(front.feet.right.x))
      const profile = stickFigureJoints(pose({ turn: 1 }), { facing })
      expect(Math.sign(profile.toes.left.x - profile.feet.left.x)).toBe(facing)
      expect(Math.sign(profile.toes.right.x - profile.feet.right.x)).toBe(facing)
    }
  })

  it('reports which feet are planted', () => {
    const rest = stickFigureJoints(REST_POSE)
    expect(rest.grounded).toEqual({ left: true, right: true })
    // At phase 0 the left leg is swinging through, lifted.
    const stepping = stickFigureJoints(walkPose(0))
    expect(stepping.grounded).toEqual({ left: false, right: true })
    expect(stepping.feetY).toBeCloseTo(stepping.feet.right.y)
    expect(jointsToScene(stepping, 10, 500).feetY).toBeCloseTo(stepping.feetY + 500)
  })
})

describe('face lines', () => {
  /** Widest line stroked after the head outline: the face's lines. */
  const faceLineWidth = (style: StickStyle) => {
    const widths: number[] = []
    let headDrawn = false
    const store: Record<string | symbol, unknown> = {}
    const ctx = new Proxy(store, {
      get: (_, key) =>
        key === 'ellipse'
          ? () => (headDrawn = true)
          : key === 'stroke'
            ? () => headDrawn && widths.push(store.lineWidth as number)
            : key in store
              ? store[key]
              : () => undefined,
      set: (_, key, value) => ((store[key] = value), true),
    }) as unknown as CanvasRenderingContext2D
    drawStickFigure(ctx, REST_POSE, { height: 300, ...style })
    return Math.max(...widths.slice(1))
  }

  it('stay lighter than the body, and are capped by the head size for thick brushes', () => {
    expect(faceLineWidth({})).toBeCloseTo(300 * 0.025 * 0.6) // default: 60% of the line
    const thick = faceLineWidth({ lineWidth: 300 * 0.055 })
    expect(thick).toBeCloseTo(0.14 * 300 * 0.12) // capped at 14% of the head radius
    expect(faceLineWidth({ lineWidth: 300 * 0.055, headSize: 0.3 })).toBeGreaterThan(thick) // a bigger head allows more
  })
})

describe('layers', () => {
  const allLayers = (log: string[]): FigureLayers => ({
    behind: () => log.push('behind'),
    body: () => log.push('body'),
    sleeve: (_ctx, _j, side) => log.push(`sleeve:${side}`),
    behindHead: () => log.push('behindHead'),
    overHead: () => log.push('overHead'),
    front: () => log.push('front'),
  })

  it('calls each hook once, in the documented order', () => {
    const { ctx, log } = recordingContext()
    drawStickFigure(ctx, POSES.wave, { layers: allLayers(log), label: 'Tum', classic: true })
    // Strokes: left leg, right leg, torso, left arm, right arm, head; the face strokes come after.
    // (Fills, the head's and the pupils', are left out.)
    const strokes = log.filter((entry) => entry !== 'fill')
    expect(strokes.slice(0, 11)).toEqual([
      'behind',
      'stroke',
      'stroke',
      'stroke',
      'body',
      'stroke',
      'sleeve:left',
      'stroke',
      'sleeve:right',
      'behindHead',
      'stroke',
    ])
    const face = strokes.slice(11, -2)
    expect(face.length).toBeGreaterThan(0)
    expect(face.every((entry) => entry === 'stroke')).toBe(true)
    expect(strokes.slice(-2)).toEqual(['overHead', 'front'])
    // The organic look draws filled shapes, but the hooks come in the same order.
    const organic = recordingContext()
    drawStickFigure(organic.ctx, POSES.wave, { layers: allLayers(organic.log) })
    expect(organic.log.filter((entry) => entry !== 'stroke' && entry !== 'fill')).toEqual([
      'behind',
      'body',
      'sleeve:left',
      'sleeve:right',
      'behindHead',
      'overHead',
      'front',
    ])
    for (const hook of ['behind', 'body', 'sleeve:left', 'sleeve:right', 'behindHead', 'overHead', 'front']) {
      expect(log.filter((entry) => entry === hook)).toHaveLength(1)
    }
  })

  it('moves the back arm and its sleeve behind the body once the figure turns', () => {
    const order = (turn: number) => {
      const { ctx, log } = recordingContext()
      drawStickFigure(ctx, pose({ turn }), { layers: allLayers(log) })
      return log.filter((entry) => entry !== 'stroke' && entry !== 'fill')
    }
    expect(order(0)).toEqual(['behind', 'body', 'sleeve:left', 'sleeve:right', 'behindHead', 'overHead', 'front'])
    expect(order(0.25)).toEqual(order(0))
    expect(order(0.6)).toEqual(['behind', 'sleeve:left', 'body', 'sleeve:right', 'behindHead', 'overHead', 'front'])
  })

  it('draws in the figure space, unmirrored, with the joints as drawn', () => {
    const { ctx, matrix } = recordingContext()
    ctx.translate(100, 200)
    const seen: Array<{ matrix: number[]; joints: StickJoints }> = []
    const style: StickStyle = {
      facing: -1,
      rubber: 1,
      layers: { body: (_ctx, joints) => seen.push({ matrix: matrix(), joints }), front: (_ctx, joints) => seen.push({ matrix: matrix(), joints }) },
    }
    const figure = { ...POSES.think, lean: 10 }
    drawStickFigure(ctx, figure, style)
    expect(seen).toHaveLength(2)
    for (const call of seen) {
      expect(call.matrix).toEqual([1, 0, 0, 1, 100, 200])
      expect(call.joints).toEqual(stickFigureJoints(figure, style))
    }
    // And the context is left as it was found.
    expect(matrix()).toEqual([1, 0, 0, 1, 100, 200])
  })

  it('passes a pen to hooks when the figure is sketched', () => {
    const { ctx } = recordingContext()
    const pens: unknown[] = []
    drawStickFigure(ctx, REST_POSE, { layers: { body: (_c, _j, _t, pen) => pens.push(pen) } })
    drawStickFigure(ctx, REST_POSE, { sketch: {}, layers: { body: (_c, _j, _t, pen) => pens.push(pen) } })
    expect(pens[0]).toBeUndefined()
    expect(pens[1]).toHaveProperty('line')
  })
})

describe('resolveStickPose and stickFigureAt', () => {
  it('folds the walk and talk into the pose', () => {
    const props: StickFigureProps = { ...REST_POSE, walk: 0.25, walking: 1, talk: 1, rubber: 0 }
    const resolved = resolveStickPose(props, 1000)
    expect(resolved.leftHip).toBeCloseTo(walkPose(0.25).leftHip)
    expect(resolved.mouth).toBeGreaterThan(0)
    expect(resolveStickPose({ ...props, walking: 0, talk: 0 }, 1000).leftHip).toBe(REST_POSE.leftHip)
  })

  it('finds the joints the target draws at a frame', () => {
    const target = stickFigureTarget({ x: 300, y: 500, style: { height: 240, rubber: 0.4, shoulderWidth: 0.05 } })
    const timeline: TimelineDefinition = {
      id: 't',
      config: { duration: 2000 },
      tracks: [
        ...poseTracks('hero', [
          { time: 0, pose: 'rest' },
          { time: 2000, pose: { ...blendPose(REST_POSE, POSES.wave, 1), lean: 8 } },
        ]),
        { id: 'x', target: 'hero', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 160 }] },
        { id: 'walk', target: 'hero', property: 'walk', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 3 }] },
        { id: 'walking', target: 'hero', property: 'walking', keyframes: [{ time: 0, value: 1 }] },
        { id: 'talk', target: 'hero', property: 'talk', keyframes: [{ time: 0, value: 1 }] },
      ],
    }
    const state = { ...deserializeTimeline(timeline).getStateAtTime(1300), currentTime: 1300 }
    const adapter = new CanvasAdapter()
    adapter.registerTarget('hero', target)
    adapter.applyState(state)
    const { ctx, strokes } = recordingContext()
    adapter.render(ctx)

    const { pose: resolved, joints } = stickFigureAt(target, { time: 1300, state }, 'hero')
    expect(resolved.mouth).toBeGreaterThan(0)
    const drawn = drawnParts(strokes, false, true, false)
    expectPoints(drawn.leftLeg, joints.limbs.leftLeg)
    expectPoints(drawn.rightLeg, joints.limbs.rightLeg)
    expectPoints(drawn.leftArm, joints.limbs.leftArm)
    expectPoints(drawn.rightArm, joints.limbs.rightArm)
    expectPoint(drawn.head, joints.head.center)
    // The feet stand at the target's x/y plus the x track.
    expect(joints.hip.x).toBeCloseTo(300 + (state.values.get('hero')!.get('x') as number))
  })

  it('refuses targets that are not stick figures', () => {
    const other = { type: 'custom' as const, x: 0, y: 0, width: 1, height: 1, draw: () => {} }
    expect(() => stickFigureAt(other, { time: 0 }, 'x')).toThrow(/stickFigureTarget/)
  })
})
