import { describe, expect, it } from 'vitest'
import { OVAL_EYE, ovalEye } from './face'

describe('ovalEye', () => {
  it('is the standard oval eye by default', () => {
    expect(ovalEye()).toEqual({ ...OVAL_EYE })
  })

  it('scales the eye and its distance from the middle together, so the eyes still nearly touch', () => {
    const big = ovalEye({ eyeScale: 1.2 })
    expect(big.rx).toBeCloseTo(OVAL_EYE.rx * 1.2, 9)
    expect(big.ry).toBeCloseTo(OVAL_EYE.ry * 1.2, 9)
    expect(big.x - big.rx).toBeCloseTo((OVAL_EYE.x - OVAL_EYE.rx) * 1.2, 9)
  })

  it('makes the eye rounder with a lower aspect, and clamps both values', () => {
    const round = ovalEye({ eyeAspect: 0.7 })
    expect(round.rx).toBe(OVAL_EYE.rx)
    expect(round.ry).toBeCloseTo(OVAL_EYE.ry * 0.7, 9)
    expect(ovalEye({ eyeScale: 5, eyeAspect: 0 })).toEqual(ovalEye({ eyeScale: 1.2, eyeAspect: 0.45 }))
  })
})
