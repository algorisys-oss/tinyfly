import { describe, expect, it } from 'vitest'
import { character, characterJoints } from '../character'
import { HUMAN_REST } from '../species/human'
import { softCartoonCharacter } from '../soft-cartoon-cast'
import { BODY_SHAPES, bodyShapeProfiles, measuredHipWidth, resolveMeasurements, type BodyShapeName } from './body-shape'
import { bodyProfileWidth, resolveOrganicBody } from './organic-body'

const DEFAULTS = { skin: '#f1bf98', ink: '#53362d', lineWidth: 1.5, shoulderWidth: 0.07, hipWidth: 0.045 }
const shaped = (measurements: Parameters<typeof bodyShapeProfiles>[0]) => bodyShapeProfiles(measurements, 0.095)

/** The torso's screen extent either side of the spine line at `at`, in px. */
function torsoSides(who: ReturnType<typeof character>, turn: number, at: number) {
  const spine = characterJoints(who, { ...HUMAN_REST, turn }).bodyContours!.spine
  const sample = spine.samples.reduce((best, s) => Math.abs(s.at - at) < Math.abs(best.at - at) ? s : best)
  return { right: sample.left.x - sample.center.x, left: sample.center.x - sample.right.x }
}

describe('body shape from measurements', () => {
  it('turns every named shape into valid torso, front and back profiles', () => {
    for (const name of Object.keys(BODY_SHAPES) as BodyShapeName[]) {
      const body = resolveOrganicBody({ measurements: name }, DEFAULTS)
      for (const profile of [body.torso, body.torsoFront, body.torsoBack]) {
        expect(profile[0].at).toBe(0)
        expect(profile.at(-1)!.at).toBe(1)
      }
    }
  })

  it('narrows at the waist of an hourglass and widens at the hips', () => {
    const { torso } = shaped('hourglass')
    const waist = bodyProfileWidth(torso, 0.42), hip = bodyProfileWidth(torso, 0)
    expect(waist).toBeLessThan(hip * 0.8)
    expect(waist).toBeLessThan(bodyProfileWidth(torso, 0.72))
  })

  it('projects the bust forward and the seat back, by how much the girths differ', () => {
    const hourglass = shaped('hourglass'), rectangle = shaped('rectangle')
    const bust = (p: typeof hourglass) => bodyProfileWidth(p.torsoFront, 0.66) - bodyProfileWidth(p.torsoBack, 0.66)
    const seat = (p: typeof hourglass) => bodyProfileWidth(p.torsoBack, 0.18) - bodyProfileWidth(p.torsoFront, 0.18)
    expect(bust(hourglass)).toBeGreaterThan(0)
    expect(bust(hourglass)).toBeGreaterThan(bust(rectangle))
    expect(seat(hourglass)).toBeGreaterThan(0)
    // With no difference between bust and underbust there is no projection.
    const flat = shaped({ height: 170, bust: 90, underbust: 90, waist: 78, hip: 92 })
    expect(Math.abs(bust(flat))).toBeLessThan(0.002)
  })

  it('carries a waist close to the hips at the front, as a belly', () => {
    const belly = (p: ReturnType<typeof shaped>) => bodyProfileWidth(p.torsoFront, 0.42) / bodyProfileWidth(p.torso, 0.42)
    expect(belly(shaped('round'))).toBeGreaterThan(belly(shaped('hourglass')))
  })

  it('works in any unit: only the ratios to height matter', () => {
    const cm = shaped({ height: 165, bust: 94, underbust: 76, waist: 70, hip: 98 })
    const inches = shaped({ height: 165 / 2.54, bust: 94 / 2.54, underbust: 76 / 2.54, waist: 70 / 2.54, hip: 98 / 2.54 })
    cm.torsoFront.forEach((point, i) => expect(inches.torsoFront[i].width).toBeCloseTo(point.width, 10))
  })

  it('is deterministic and JSON-safe', () => {
    expect(JSON.parse(JSON.stringify(shaped('pear')))).toEqual(shaped('pear'))
  })

  it('defaults the underbust and rejects measurements that are not a body', () => {
    expect(resolveMeasurements({ height: 160, bust: 100, waist: 80, hip: 100 }).underbust).toBeCloseTo(86)
    expect(() => resolveMeasurements('banana' as BodyShapeName)).toThrow(/unknown shape/)
    expect(() => resolveMeasurements({ height: 160, bust: -1, waist: 80, hip: 100 })).toThrow(/bust/)
    expect(() => resolveMeasurements({ height: 160, bust: 80, underbust: 90, waist: 80, hip: 100 })).toThrow(/underbust/)
    expect(() => resolveMeasurements({ height: 160, bust: 400, waist: 80, hip: 100 })).toThrow(/bust/)
  })
})

describe('organic torso seen from any side', () => {
  it('leaves an unmeasured body exactly as it was: front and back are torso × depth', () => {
    const body = resolveOrganicBody({ depth: 0.6 }, DEFAULTS)
    body.torso.forEach((point, i) => {
      expect(body.torsoFront[i].width).toBeCloseTo(point.width * 0.6, 12)
      expect(body.torsoBack[i].width).toBeCloseTo(point.width * 0.6, 12)
    })
  })

  it('is symmetric from the front and leads with the bust in profile, either way round', () => {
    const who = character({ figure: 'organic', body: { measurements: 'hourglass' } })
    const front = torsoSides(who, 0, 0.66)
    expect(front.left).toBeCloseTo(front.right, 6)
    const right = torsoSides(who, 1, 0.66), left = torsoSides(who, 3, 0.66)
    expect(right.right).toBeGreaterThan(right.left * 1.3)
    expect(left.left).toBeCloseTo(right.right, 6)
    expect(left.right).toBeCloseTo(right.left, 6)
    // The seat trails behind.
    const seat = torsoSides(who, 1, 0.18)
    expect(seat.left).toBeGreaterThan(seat.right)
  })

  it('blends width and depth at three-quarter turns', () => {
    const who = character({ figure: 'organic', body: { measurements: 'hourglass' } })
    const front = torsoSides(who, 0, 0.66), threeQuarter = torsoSides(who, 0.5, 0.66), side = torsoSides(who, 1, 0.66)
    expect(threeQuarter.right).toBeGreaterThan(threeQuarter.left)
    expect(threeQuarter.right).toBeLessThan(Math.max(front.right, side.right) + 1e-6)
  })

  it('spaces the legs under measured hips unless hipWidth is given', () => {
    expect(measuredHipWidth('pear')).toBeGreaterThan(measuredHipWidth('rectangle'))
    const pear = character({ figure: 'organic', body: { measurements: 'pear' } })
    const set = character({ figure: 'organic', hipWidth: 0.03, body: { measurements: 'pear' } })
    const spread = (who: typeof pear) => {
      const j = characterJoints(who, HUMAN_REST)
      return j.chains['leg.left'][0].x - j.chains['leg.right'][0].x
    }
    expect(spread(pear)).toBeGreaterThan(spread(set))
  })

  it('lets new measurements replace a soft cartoon preset torso', () => {
    const preset = softCartoonCharacter('youngWoman')
    const pear = softCartoonCharacter('youngWoman', { body: { measurements: 'pear' } })
    expect(preset.body!.torso[2].width).toBe(0.061)
    // Her shoulders (0.065 + 0.025) are below the 0.095 minimum.
    expect(pear.body!.torso).toEqual(shaped('pear').torso)
  })
})
