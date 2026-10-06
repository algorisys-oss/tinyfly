import { describe, it, expect } from 'vitest'
import { GAITS, gaitPose, gaitStrideLength, resolveGait, type GaitName } from './gaits'
import { REST_POSE, pose, stickFigureAt, stickFigureJoints, stickFigureTarget, strideLength, walkPose } from './stick-figure'
import { Timeline } from '../engine/core/timeline'

const NAMES = Object.keys(GAITS) as GaitName[]

describe('gaits', () => {
  it('walk is walkPose', () => {
    for (const phase of [0, 0.1, 0.3, 0.77]) expect(gaitPose('walk', phase, pose({ turn: 1 }))).toEqual(walkPose(phase, pose({ turn: 1 })))
    expect(gaitStrideLength('walk', 200)).toBeCloseTo(strideLength(200))
  })

  it('an unknown name walks', () => {
    expect(resolveGait('moonwalk-ish')).toBe(GAITS.walk)
    expect(resolveGait(undefined)).toBe(GAITS.walk)
  })

  for (const name of NAMES) {
    it(`${name}: cycles (phase 1 is phase 0) and moves smoothly`, () => {
      const start = gaitPose(name, 0)
      const end = gaitPose(name, 1)
      for (const field of Object.keys(REST_POSE) as (keyof typeof REST_POSE)[]) expect(end[field], field).toBeCloseTo(start[field])
      let previous = stickFigureJoints(start, { height: 300 })
      for (let i = 1; i <= 60; i++) {
        const joints = stickFigureJoints(gaitPose(name, i / 60), { height: 300 })
        for (const side of ['left', 'right'] as const) {
          const moved = Math.hypot(joints.toes[side].x - previous.toes[side].x, joints.toes[side].y - previous.toes[side].y)
          expect(moved, `${name} ${side} toe at ${i}`).toBeLessThan(30)
        }
        previous = joints
      }
      expect(gaitStrideLength(name, 300)).toBeGreaterThan(0)
    })
  }

  it('give each gait its character', () => {
    // A run is off the ground as the legs pass; the sneak is on tiptoe and crouched; tired slumps; strut puts the chest out.
    expect(gaitPose('run', 0).rise).toBeGreaterThan(0.03)
    expect(gaitPose('sneak', 0.3).leftAnkle).toBeGreaterThan(20)
    expect(stickFigureJoints(gaitPose('sneak', 0.25)).hip.y).toBeGreaterThan(stickFigureJoints(gaitPose('walk', 0.25)).hip.y)
    expect(gaitPose('tired', 0).bend).toBeGreaterThan(0)
    expect(gaitPose('strut', 0).bend).toBeLessThan(0)
    // The double bounce bobs twice a step: up at a quarter step too.
    expect(gaitPose('doubleBounce', 0.25).rise).toBeCloseTo(gaitPose('doubleBounce', 0).rise)
    expect(gaitPose('doubleBounce', 0.125).rise).toBeLessThan(gaitPose('doubleBounce', 0).rise)
  })

  it('face the way the figure faces, in every style', () => {
    const styles = [{}, { classic: true }, { rubber: 1 }, { headSize: 0.36, shoulderWidth: 0.07 }]
    for (const name of NAMES) {
      for (const style of styles) {
        for (const facing of [1, -1] as const) {
          for (const phase of [0, 0.2, 0.45, 0.7]) {
            const joints = stickFigureJoints(gaitPose(name, phase, pose({ turn: 1 })), { height: 200, facing, ...style })
            // Toes point the way it faces (or straight down, on tiptoe), never back.
            for (const side of ['left', 'right'] as const) {
              const along = (joints.toes[side].x - joints.feet[side].x) * facing
              if (!('classic' in style)) expect(along, `${name} ${facing} ${phase} ${side}`).toBeGreaterThan(-1)
            }
            expect(joints.head.center.y, `${name} head above hips`).toBeLessThan(joints.hip.y)
          }
        }
      }
    }
  })

  it('keep raised arms raised', () => {
    const waving = pose({ rightShoulder: 135, rightElbow: 30 })
    for (const name of NAMES) expect(gaitPose(name, 0.3, waving).rightShoulder).toBe(135)
  })

  it('a gait track switches a figure target’s gait', () => {
    const target = stickFigureTarget({ x: 0, y: 0, style: { height: 200 } })
    const timeline = new Timeline({
      id: 't',
      tracks: [
        { id: 'w', target: 'hero', property: 'walking', keyframes: [{ time: 0, value: 1 }] },
        { id: 'p', target: 'hero', property: 'walk', keyframes: [{ time: 0, value: 0.3 }, { time: 2000, value: 0.3 }] },
        { id: 'g', target: 'hero', property: 'gait', keyframes: [{ time: 0, value: 'walk' }, { time: 1000, value: 'walk' }, { time: 1001, value: 'sneak' }] },
      ],
    })
    const at = (time: number) => stickFigureAt(target, { time, state: timeline.getStateAtTime(time) }, 'hero').pose
    expect(at(500).leftAnkle).toBe(0)
    expect(at(1500).leftAnkle).toBeGreaterThan(20)
  })
})
