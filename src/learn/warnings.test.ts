import { describe, it, expect } from 'vitest'
import { learnerWarning } from './warnings'

describe('learnerWarning', () => {
  it('names the selector that matched nothing', () => {
    expect(learnerWarning('gsap-compat: no elements found for target ".bxo"')).toBe(
      'Nothing in the preview matches `.bxo`, so that tween does nothing. Check the spelling against the class names in the markup.'
    )
  })

  it('explains drawSVG on something that is not a shape', () => {
    expect(learnerWarning('gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)')).toContain('Target the shapes inside it')
  })

  it('explains a spring on a colour', () => {
    expect(learnerWarning('gsap-compat: spring works on numbers, so "backgroundColor" on "el-1" eases instead')).toBe(
      '`spring` only moves numbers, so `backgroundColor` eases instead. Colours and other values need `ease` and `duration`.'
    )
  })

  it('suggests fromTo when a value snaps', () => {
    expect(learnerWarning('gsap-compat: no usable start value for "color" on "el-1" — it will snap to red. Use fromTo() to animate it.')).toContain('Use `fromTo()`')
  })

  it('hides the static-default notice every first tween would raise', () => {
    expect(learnerWarning('gsap-compat: no start value for "x" on "el-1" — using the static default 0. GSAP would read the live DOM here')).toBeUndefined()
  })

  it('passes anything else through without the prefix', () => {
    expect(learnerWarning('gsap-compat: something new')).toBe('something new')
  })
})
