import { describe, it, expect } from 'vitest'
import { pose, stickFigureJoints, REST_POSE, blendPose } from './stick-figure'

const H = 300

describe('bend (the line of action)', () => {
  it('rests at 0, drawing the straight spine', () => {
    expect(REST_POSE.bend).toBe(0)
    const straight = stickFigureJoints(pose({}), { height: H })
    expect(straight.limbs.spine).toHaveLength(2)
  })

  it('curves the spine and turns the chest and head with its end', () => {
    const joints = stickFigureJoints(pose({ bend: 30 }), { height: H })
    const spine = joints.limbs.spine
    expect(spine.length).toBeGreaterThan(2)
    // The spine leaves the hips straight up and curls forward (+x) as it rises.
    expect(spine[1].x).toBeLessThan(spine[spine.length - 1].x)
    expect(spine[spine.length - 1].x).toBeGreaterThan(0)
    expect(joints.neck).toEqual(spine[spine.length - 1])
    // The head turns as far as the spine's end.
    expect(joints.head.angle).toBeCloseTo((30 * Math.PI) / 180)
    // The spine keeps its length (an arc, not a stretch).
    let length = 0
    for (let i = 1; i < spine.length; i++) length += Math.hypot(spine[i].x - spine[i - 1].x, spine[i].y - spine[i - 1].y)
    const straight = stickFigureJoints(pose({}), { height: H })
    expect(length).toBeCloseTo(straight.hip.y - straight.neck.y, 0)
  })

  it('moves the neck less than a lean of the same angle, but turns the head as far', () => {
    const bent = stickFigureJoints(pose({ bend: 30 }), { height: H })
    const leaned = stickFigureJoints(pose({ lean: 30 }), { height: H })
    expect(bent.neck.x).toBeLessThan(leaned.neck.x)
    expect(bent.head.angle).toBeCloseTo(leaned.head.angle)
  })

  it('arches back when negative, and mirrors with facing', () => {
    const back = stickFigureJoints(pose({ bend: -25 }), { height: H })
    expect(back.neck.x).toBeLessThan(0)
    const left = stickFigureJoints(pose({ bend: 25 }), { height: H, facing: -1 })
    expect(left.neck.x).toBeCloseTo(-stickFigureJoints(pose({ bend: 25 }), { height: H }).neck.x)
  })

  it('carries the arms with the chest', () => {
    const straight = stickFigureJoints(pose({ rightShoulder: 90 }), { height: H })
    const bent = stickFigureJoints(pose({ rightShoulder: 90, bend: 40 }), { height: H })
    // The arm keeps its length from the shoulder.
    const reach = (j: typeof straight) => Math.hypot(j.hands.right.x - j.shoulders.right.x, j.hands.right.y - j.shoulders.right.y)
    expect(reach(bent)).toBeCloseTo(reach(straight))
    expect(bent.shoulders.right).not.toEqual(straight.shoulders.right)
  })

  it('blends smoothly through 0', () => {
    const a = pose({ bend: -20 })
    const b = pose({ bend: 20 })
    let previous = stickFigureJoints(a, { height: H }).head.center
    for (let i = 1; i <= 20; i++) {
      const head = stickFigureJoints(blendPose(a, b, i / 20), { height: H }).head.center
      expect(Math.hypot(head.x - previous.x, head.y - previous.y)).toBeLessThan(10)
      previous = head
    }
  })
})
