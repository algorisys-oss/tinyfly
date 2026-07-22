import { describe, it, expect } from 'vitest'
import { cameraFromState, cameraSvgTransform } from './camera'
import type { AnimationState } from '../../engine'

function state(cam?: Record<string, number>): AnimationState {
  const values = new Map<string, Map<string, number>>()
  if (cam) values.set('Camera', new Map(Object.entries(cam)))
  return { values } as unknown as AnimationState
}

describe('cameraFromState', () => {
  it('is null when there is no Camera target', () => {
    expect(cameraFromState(state())).toBeNull()
    expect(cameraFromState(null)).toBeNull()
  })

  it('is null at identity', () => {
    expect(cameraFromState(state({ x: 0, y: 0, scale: 1, rotate: 0 }))).toBeNull()
  })

  it('reads pan/zoom/rotate, defaulting missing props', () => {
    expect(cameraFromState(state({ x: 10, scale: 2 }))).toEqual({ x: 10, y: 0, scale: 2, rotate: 0 })
    expect(cameraFromState(state({ rotate: 45 }))).toEqual({ x: 0, y: 0, scale: 1, rotate: 45 })
  })
})

describe('cameraSvgTransform', () => {
  it('centres the scale/rotate and applies pan', () => {
    expect(cameraSvgTransform({ x: 10, y: 0, scale: 2, rotate: 0 }, 150, 100)).toBe(
      'translate(150 100) translate(10 0) scale(2) rotate(0) translate(-150 -100)'
    )
  })
})
