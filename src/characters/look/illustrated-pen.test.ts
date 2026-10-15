import { describe, it, expect } from 'vitest'
import { resolveIllustration } from './illustrated-pen'
import { illustrationTones } from './illustration-color'

const hsl = (css: string) => css.match(/[\d.]+/g)!.map(Number)

describe('illustrationTones', () => {
  it('shades a colour deeper and toward red-violet, and lights it toward warm yellow', () => {
    const skin = illustrationTones('#c98d62')!
    const baseLight = 58.6 // #c98d62 is about hsl(25, 48%, 59%)
    const [shadowHue, , shadowLight] = hsl(skin.shadow)
    const [coreHue, , coreLight] = hsl(skin.core)
    const [lightHue, , highlightLight] = hsl(skin.highlight)
    expect(shadowLight).toBeLessThan(baseLight)
    expect(coreLight).toBeLessThan(shadowLight)
    expect(highlightLight).toBeGreaterThan(baseLight)
    // Orange skin turns back toward red in shadow and on toward yellow in light.
    expect(shadowHue).toBeLessThan(25)
    expect(coreHue).toBeLessThan(shadowHue)
    expect(lightHue).toBeGreaterThan(25)
  })

  it('gives greys a cool shadow rather than a hue they do not have', () => {
    const [hue, saturation] = hsl(illustrationTones('#808080')!.shadow)
    expect(hue).toBe(230)
    expect(saturation).toBeGreaterThan(0)
  })

  it('leaves translucent and non-colour fills unpainted', () => {
    expect(illustrationTones('rgba(255,255,255,0.25)')).toBeUndefined()
    expect(illustrationTones('transparent')).toBeUndefined()
  })

  it('is a pure function of the colour', () => {
    expect(illustrationTones('#56704f')).toEqual(illustrationTones('#56704f'))
  })
})

describe('resolveIllustration', () => {
  it('fills in defaults and normalises the light', () => {
    expect(resolveIllustration()).toEqual({ light: [-0.8, -0.6], weight: 0.6, taper: 0.7, shadow: 1, highlight: 0.6 })
    const { light } = resolveIllustration({ light: [3, 4] })
    expect(light[0]).toBeCloseTo(0.6)
    expect(light[1]).toBeCloseTo(0.8)
  })

  it('takes a body light as the default and an explicit light over it', () => {
    expect(resolveIllustration({}, [0, -2]).light).toEqual([0, -1])
    expect(resolveIllustration({ light: [1, 0] }, [0, -2]).light).toEqual([1, 0])
  })

  it('rejects values out of range', () => {
    expect(() => resolveIllustration({ taper: -0.1 })).toThrow(/taper/)
    expect(() => resolveIllustration({ highlight: Number.NaN })).toThrow(/highlight/)
    expect(() => resolveIllustration({ light: [0, 0] })).toThrow(/light/)
  })
})
