import { describe, expect, it } from 'vitest'
import { HUMAN_REST, humanPlan } from '../species/human'
import { reachPose } from './reach'
import { solvePlanSpace } from './skeleton'

describe('two-bone reaching with authored yaw', () => {
  const plan = humanPlan()
  const height = 1.7
  for (const side of ['left', 'right'] as const) {
    it(`reaches new ${side} ankle targets without changing hip turn-out`, () => {
      const chain = `leg.${side}`
      for (const rotate of [-90, -40, 0, 40, 90]) {
        const pose = {
          ...HUMAN_REST, [`${chain}.rotate`]: rotate,
          [`${chain}.swing`]: 18, [`${chain}.spread`]: 6, [`${chain}.knee`]: 35,
        }
        const desired = { ...pose, [`${chain}.swing`]: 35, [`${chain}.spread`]: 9, [`${chain}.knee`]: 50 }
        const target = solvePlanSpace(plan, desired, height).chains[chain].joints3[2]
        const result = reachPose(plan, pose, chain, target, { height })
        const ankle = solvePlanSpace(plan, result, height).chains[chain].joints3[2]
        expect(result[`${chain}.rotate`]).toBe(rotate)
        expect(Math.hypot(...ankle.map((v, axis) => v - target[axis]))).toBeLessThan(1e-9)
        for (const field of ['swing', 'spread', 'knee']) expect(result[`${chain}.${field}`]).toBeCloseTo(desired[`${chain}.${field}`], 9)
      }
    })
  }
})

describe('reaching the short way', () => {
  it('raises an arm forward to a point in front and above, not out to the side and over', () => {
    const plan = humanPlan()
    const height = 300
    const shoulder = solvePlanSpace(plan, HUMAN_REST, height).chains['arm.left'].joints3[0]
    const target: [number, number, number] = [shoulder[0], shoulder[1] + 60, shoulder[2] + 60]
    const pose = reachPose(plan, HUMAN_REST, 'arm.left', target, { height })
    expect(Math.abs(pose['arm.left.spread'])).toBeLessThan(45)
    expect(pose['arm.left.swing']).toBeGreaterThan(90)
    const hand = solvePlanSpace(plan, { ...HUMAN_REST, ...pose }, height).chains['arm.left'].joints3[2]
    expect(Math.hypot(hand[0] - target[0], hand[1] - target[1], hand[2] - target[2])).toBeLessThan(1e-6)
  })
})
