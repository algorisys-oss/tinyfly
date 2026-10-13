import { describe, expect, it } from 'vitest'
import { validateScene3D } from '../../scene-3d/validate-scene'
import { cricketClip, cricketField, cricketFieldingAreaContains, cricketFieldingPositions, cricketFieldingOverlay, CRICKET_MARKING_PROFILES, type CricketFormat, type CricketMarkingProfile } from './index'

const formats: CricketFormat[] = ['test', 'odi', 't20']
const profiles: CricketMarkingProfile[] = ['mcc', 'icc-men', 'icc-women']

describe('cricket marking profiles', () => {
  it('defaults explicitly to ICC men independently of cast', () => {
    for (const cast of ['adults', 'men', 'children', 'mixed'] as const) expect(cricketField({ cast }).markingProfile).toBe('icc-men')
    expect(Object.isFrozen(CRICKET_MARKING_PROFILES)).toBe(true)
    expect(Object.isFrozen(CRICKET_MARKING_PROFILES['icc-women'])).toBe(true)
  })

  it.each(formats)('keeps %s wicket/crease relationships while changing painted lateral extent', format => {
    for (const markingProfile of profiles) {
      const field = cricketField({ format, markingProfile })
      expect(validateScene3D(field.scene)).toEqual([])
      for (const [end, sign] of [['striker', 1], ['bowler', -1]] as const) {
        const popping = field.scene.objects.find(o => o.id === `${end}-popping-line`)!
        const bowling = field.scene.objects.find(o => o.id === `${end}-bowling-line`)!
        const returns = field.scene.objects.filter(o => o.id.startsWith(`${end}-return-line`))
        if (popping.kind !== 'line' || bowling.kind !== 'line') throw new Error('Expected crease lines')
        const extent = markingProfile === 'mcc' ? 1.83 : 7.5
        expect(popping.points).toEqual([[-extent, .02, sign * 8.84], [extent, .02, sign * 8.84]])
        expect(bowling.points).toEqual([[-1.32, .02, sign * 10.06], [1.32, .02, sign * 10.06]])
        for (const line of returns) {
          if (line.kind !== 'line') throw new Error('Expected return line')
          expect(Math.abs(line.points[0][0])).toBe(1.32)
          expect(line.points[0][2]).toBe(sign * 8.84)
          expect(Math.abs(line.points[1][2] - line.points[0][2])).toBeGreaterThanOrEqual(2.44)
        }
        expect(field.landmarks[`${end}-wicket`]).toEqual([0, 0, sign * 10.06])
      }
    }
  })

  it.each(['odi', 't20'] as const)('uses wicket-centred arcs and exact straight sides for %s', format => {
    for (const [markingProfile, radius] of [['icc-men', 27.43], ['icc-women', 23]] as const) {
      const field = cricketField({ format, markingProfile })
      expect(field.fieldingArea).toEqual({ radius, centres: [[0, 0, -10.06], [0, 0, 10.06]] })
      const line = field.scene.objects.find(o => o.id === 'fielding-circle')!
      if (line.kind !== 'line') throw new Error('Expected restriction-area line')
      expect(line.closed).toBe(true)
      const points = line.points
      expect(points).toHaveLength(130)
      expect(Math.max(...points.map(p => p[0]))).toBeCloseTo(radius, 10)
      expect(Math.min(...points.map(p => p[0]))).toBeCloseTo(-radius, 10)
      expect(Math.max(...points.map(p => p[2]))).toBeCloseTo(10.06 + radius, 10)
      expect(Math.min(...points.map(p => p[2]))).toBeCloseTo(-10.06 - radius, 10)
      // The connecting chords are straight sides at +/-radius, not a midpoint circle.
      expect(points[0]).toEqual([radius, .018, 10.06])
      expect(points[64][0]).toBeCloseTo(-radius, 10)
      expect(points[65][0]).toBeCloseTo(-radius, 10)
      expect(points[64][2]).toBeCloseTo(10.06, 10)
      expect(points[65][2]).toBeCloseTo(-10.06, 10)
      expect(points[129][0]).toBeCloseTo(radius, 10)
      expect(points[129][2]).toBeCloseTo(-10.06, 10)
      for (let i = 0; i < points.length; i++) {
        const centreZ = i < 65 ? 10.06 : -10.06
        expect(Math.hypot(points[i][0], points[i][2] - centreZ)).toBeCloseTo(radius, 10)
      }
      expect(field.scene.objects.find(o => o.id === 'boundary')).not.toEqual(line)
    }
  })

  it('omits restriction lines for Test and base MCC Laws', () => {
    for (const markingProfile of profiles) {
      const field = cricketField({ format: 'test', markingProfile })
      expect(field.fieldingArea).toBeNull()
      expect(field.scene.objects.some(o => o.id === 'fielding-circle')).toBe(false)
    }
    for (const format of formats) expect(cricketField({ format, markingProfile: 'mcc' }).fieldingArea).toBeNull()
  })

  it('classifies the ideal capsule and includes its boundary, independently of point height', () => {
    const field = JSON.parse(JSON.stringify(cricketField()))
    for (const [x, z] of [[0, 30], [0, -30], [27.43, 0], [-27.43, 5], [0, 37.49], [0, -37.49], [27.43, 10.06]]) {
      expect(cricketFieldingAreaContains(field, [x, 0, z])).toBe(true)
      expect(cricketFieldingAreaContains(field, [x, 3, z])).toBe(true)
    }
    for (const [x, z] of [[27.430001, 0], [0, 37.490001], [0, -37.490001], [27.43, 10.07]]) expect(cricketFieldingAreaContains(field, [x, 0, z])).toBe(false)
    expect(cricketFieldingAreaContains(cricketField({ markingProfile: 'icc-women' }), [25, 0, 0])).toBe(false)
    expect(cricketFieldingAreaContains(field, [25, 0, 0])).toBe(true)
    expect(cricketFieldingAreaContains(cricketField({ markingProfile: 'mcc' }), [0, 0, 0])).toBeNull()
    delete field.fieldingArea; delete field.markingProfile
    expect(cricketFieldingAreaContains(field, [0, 0, 0])).toBeNull()
  })

  it('owns setup data and creates optional labelled markers without changing the story', () => {
    for (const markingProfile of ['icc-men', 'icc-women'] as const) {
      const field = cricketField({ markingProfile }), original = JSON.stringify(field)
      const positions = cricketFieldingPositions(field), overlay = cricketFieldingOverlay(field)
      expect(positions).toHaveLength(11)
      expect(positions.filter(p => !p.inside).map(p => p.id)).toEqual(['fine-leg', 'third-man'])
      expect(overlay).toHaveLength(11)
      expect(new Set(overlay.map(o => o.id)).size).toBe(11)
      expect(validateScene3D({ ...field.scene, objects: [...field.scene.objects, ...overlay] })).toEqual([])
      expect(JSON.stringify(field)).toBe(original)
      positions[0].position[0] = 999
      expect(field.landmarks.bowler[0]).not.toBe(999)
    }
    expect(cricketFieldingOverlay(cricketField({ format: 'test' }))).toEqual([])
    expect(cricketFieldingPositions(cricketField({ markingProfile: 'mcc' })).every(p => p.inside === null)).toBe(true)
    const clips = profiles.map(markingProfile => cricketClip({ markingProfile, every: 1000 }))
    expect(clips[0].timeline).toEqual(clips[1].timeline)
    expect(clips[1].timeline).toEqual(clips[2].timeline)
  })

  it('rejects unknown profiles and malformed classification inputs', () => {
    expect(() => cricketField({ markingProfile: 'constructor' as CricketMarkingProfile })).toThrow()
    expect(() => cricketField({ markingProfile: '__proto__' as CricketMarkingProfile })).toThrow()
    expect(() => cricketFieldingAreaContains(cricketField(), [NaN, 0, 0])).toThrow()
    const field = cricketField()
    field.fieldingArea!.radius = Infinity
    expect(() => cricketFieldingAreaContains(field, [0, 0, 0])).toThrow()
    const parented = cricketField()
    parented.scene.objects.find(o => o.id === 'bowler')!.parent = 'team'
    expect(() => cricketFieldingPositions(parented)).toThrow(/unparented/)
    expect(() => cricketFieldingOverlay(parented)).toThrow(/unparented/)
  })
})
