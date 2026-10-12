import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { drawStickFigure, pose, stickFigureJoints, stickFigureTarget, stickFigureAt } from './stick-figure'
import type { AnimationState } from '../engine/types'

const length = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

describe('stick figure arm proportions', () => {
  it('scales both arm bones, while hands, shoulders, torso and legs retain their proportions', () => {
    for (const classic of [false, true]) for (const facing of [-1, 1]) for (const stretch of [0.6, 1, 1.7]) {
      const figure = pose({ leftShoulder: 90, rightShoulder: 65, leftElbow: -50, rightElbow: 40, leftWrist: 30, spin: 22, lean: 15, stretch })
      const style = { height: 300, classic, facing, shoulderWidth: 0.04 }
      const normal = stickFigureJoints(figure, style)
      for (const armLength of [0.7, 1.4]) {
        const changed = stickFigureJoints(figure, { ...style, armLength })
        for (const side of ['left', 'right'] as const) {
          expect(length(changed.shoulders[side], changed.elbows[side]) / length(normal.shoulders[side], normal.elbows[side])).toBeCloseTo(armLength)
          expect(length(changed.elbows[side], changed.hands[side]) / length(normal.elbows[side], normal.hands[side])).toBeCloseTo(armLength)
          expect(length(changed.hands[side], changed.fingertips[side])).toBeCloseTo(length(normal.hands[side], normal.fingertips[side]))
        }
        expect(changed.shoulders).toEqual(normal.shoulders)
        expect(changed.hip).toEqual(normal.hip)
        expect(changed.neck).toEqual(normal.neck)
        expect(changed.head).toEqual(normal.head)
        expect(changed.feet).toEqual(normal.feet)
      }
    }
  })

  it('retains the default drawing and exposes the same extended wrists through target scene joints', () => {
    const figure = pose({ rightShoulder: 90, rightElbow: 0 })
    const render = (armLength?: number) => {
      const canvas = createCanvas(400, 400)
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
      ctx.translate(200, 370)
      drawStickFigure(ctx, figure, { height: 300, armLength })
      return canvas.toBuffer('image/png')
    }
    expect(render().equals(render(1))).toBe(true)
    expect(render().equals(render(1.4))).toBe(false)
    const target = stickFigureTarget({ x: 200, y: 370, pose: figure, style: { height: 300, armLength: 1.4 } })
    const state = { values: new Map() } as AnimationState
    const scene = stickFigureAt(target, { time: 0, state }, 'person').joints
    const local = stickFigureJoints(figure, { height: 300, armLength: 1.4 })
    expect(scene.hands.right.x).toBeCloseTo(200 + local.hands.right.x)
    expect(scene.hands.right.y).toBeCloseTo(370 + local.hands.right.y)
  })

  it('rejects invalid arm-length multipliers instead of producing broken joints', () => {
    for (const armLength of [0, -1, NaN, Infinity]) expect(() => stickFigureJoints(pose({}), { armLength })).toThrow('armLength')
  })
})
