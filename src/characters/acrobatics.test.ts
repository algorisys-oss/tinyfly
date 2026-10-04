import { describe, it, expect } from 'vitest'
import { FLIPS, flipPose, flipTracks, flipTravel, type FlipName } from './acrobatics'
import { REST_POSE, stickFigureJoints } from './stick-figure'

const NAMES = Object.keys(FLIPS) as FlipName[]

describe('flips', () => {
  it('include front, back, layout, scissor and side flips, cartwheel, back handspring and leaps', () => {
    expect(NAMES).toEqual(expect.arrayContaining(['frontFlip', 'backFlip', 'layout', 'scissorFlip', 'sideFlip', 'cartwheel', 'backHandspring', 'splitLeap', 'toeTouch']))
  })

  for (const name of NAMES) {
    const flip = FLIPS[name]

    it(`${name}: starts and ends standing, on the ground`, () => {
      for (const progress of [0, 1]) {
        const figure = flipPose(name, progress)
        expect(figure.spin).toBe(0)
        expect(figure.rise).toBe(0)
        expect(figure.leftHip).toBe(REST_POSE.leftHip)
        expect(figure.turn).toBe(flip.view)
      }
    })

    it(`${name}: turns all the way round in the air, highest half way`, () => {
      const at = (air: number) => flipPose(name, flip.takeoff + air * (flip.landing - flip.takeoff))
      expect(at(0.5).spin).toBeCloseTo(flip.spin / 2)
      expect(at(0.5).rise).toBeCloseTo(flip.height)
      expect(Math.abs(at(0.99).spin)).toBeGreaterThanOrEqual(Math.abs(flip.spin) * 0.97)
      expect(at(0.25).rise).toBeLessThan(at(0.5).rise)
    })

    it(`${name}: moves fluidly (no jumps between frames at 60 fps)`, () => {
      const frames = Math.round((flip.duration / 1000) * 60)
      let previous = stickFigureJoints(flipPose(name, 0))
      for (let i = 1; i <= frames; i++) {
        const joints = stickFigureJoints(flipPose(name, i / frames))
        // The head travels at most a fifth of the height per frame.
        const moved = Math.hypot(joints.head.center.x - previous.head.center.x, joints.head.center.y - previous.head.center.y)
        expect(moved, `${name} frame ${i}`).toBeLessThan(0.2 * joints.height)
        previous = joints
      }
    })
  }

  it('front flips roll forward, back flips backward', () => {
    expect(flipPose('frontFlip', 0.5).spin).toBeGreaterThan(0)
    expect(flipPose('backFlip', 0.5).spin).toBeLessThan(0)
  })

  it('the cartwheel puts the hands near the ground upside down', () => {
    const flip = FLIPS.cartwheel
    const joints = stickFigureJoints(flipPose('cartwheel', (flip.takeoff + flip.landing) / 2), { height: 300 })
    const lowestHand = Math.max(joints.hands.left.y, joints.hands.right.y)
    expect(Math.abs(lowestHand)).toBeLessThan(0.06 * 300)
  })

  it('travels only while airborne', () => {
    expect(flipTravel('frontFlip', 0.1, 300)).toBe(0)
    expect(flipTravel('frontFlip', 1, 300)).toBeCloseTo(FLIPS.frontFlip.travel * 300)
  })

  it('bakes to plain keyframe tracks, with x travel when given a height', () => {
    const tracks = flipTracks('tum', 'backFlip', { start: 500, height: 300, samples: 20 })
    const spin = tracks.find((t) => t.property === 'spin')!
    expect(spin.keyframes).toHaveLength(21)
    expect(spin.keyframes[0].time).toBe(500)
    expect(spin.keyframes[20].time).toBe(500 + FLIPS.backFlip.duration)
    const x = tracks.find((t) => t.property === 'x')!
    expect(x.keyframes[20].value).toBeCloseTo(FLIPS.backFlip.travel * 300)
    expect(JSON.parse(JSON.stringify(tracks))).toEqual(tracks)
    expect(flipTracks('tum', 'backFlip').find((t) => t.property === 'x')).toBeUndefined()
  })
})
