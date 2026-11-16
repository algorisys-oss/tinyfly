import { describe, expect, it } from 'vitest'
import { humanPlan, humanPose } from '../species/human'
import { hangingTilt, rotX, rotZ, solvePlanSpace, tilt } from './skeleton'

const rad = (degrees: number) => (degrees * Math.PI) / 180
const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 12))

describe('bone tilts', () => {
  it('swing alone and spread alone turn as before', () => {
    for (const angle of [-150, -40, 0, 25, 90, 170]) {
      close(tilt([0, -1, 0], rad(angle), 0), rotX([0, -1, 0], rad(angle)))
      close(tilt([0, -1, 0], 0, rad(angle)), rotZ([0, -1, 0], rad(angle)))
    }
  })

  it('finds the tilt back from a direction, the short way', () => {
    for (const [swing, spread] of [[30, 10], [90, -20], [-60, 45], [120, 30]]) {
      const back = hangingTilt(tilt([0, -1, 0], rad(swing), rad(spread)))
      expect(back.swing).toBeCloseTo(rad(swing), 12)
      expect(back.spread).toBeCloseTo(rad(spread), 12)
    }
  })
})

describe('no gimbal lock', () => {
  const plan = humanPlan()
  const joints = (pose: Record<string, number>, chain: string) => solvePlanSpace(plan, humanPose(pose), 300).chains[chain].joints3

  it('spreads the knees of a seated figure', () => {
    const together = joints({ 'leg.left.swing': 90, 'leg.left.knee': 90, 'leg.left.spread': 0 }, 'leg.left')
    const apart = joints({ 'leg.left.swing': 90, 'leg.left.knee': 90, 'leg.left.spread': 30 }, 'leg.left')
    expect(apart[1][0] - together[1][0]).toBeGreaterThan(15)
    // The shin still hangs from the knee, the foot under it.
    expect(Math.abs(apart[2][0] - apart[1][0] - (together[2][0] - together[1][0]))).toBeGreaterThan(10)
    expect(apart[2][1]).toBeLessThan(apart[1][1] - 50)
  })

  it('brings hands together in front: spread and forearm bend work on an arm held forward', () => {
    const ahead = joints({ 'arm.left.swing': 90, 'arm.left.spread': 0, 'arm.left.elbow': 0 }, 'arm.left')
    const inward = joints({ 'arm.left.swing': 90, 'arm.left.spread': -20, 'arm.left.elbow': 0 }, 'arm.left')
    const bent = joints({ 'arm.left.swing': 90, 'arm.left.spread': 0, 'arm.left.elbow': 0, 'arm.left.bend': -60 }, 'arm.left')
    expect(ahead[2][0] - inward[2][0]).toBeGreaterThan(15)
    expect(ahead[2][0] - bent[2][0]).toBeGreaterThan(30)
  })

  it('bends the elbow about the upper arm, wherever the upper arm points', () => {
    // Out to the side, a bent elbow brings the forearm forward, level.
    const [, elbow, hand] = joints({ 'arm.left.spread': 90, 'arm.left.elbow': 90, 'arm.left.bend': 0 }, 'arm.left')
    expect(hand[2] - elbow[2]).toBeGreaterThan(40)
    expect(hand[1]).toBeCloseTo(elbow[1], 6)
  })
})
