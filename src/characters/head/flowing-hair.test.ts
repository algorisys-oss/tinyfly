import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { character, drawCharacterHead } from '../character'
import { humanPose } from '../species/human'
import { hairFollowTracks } from '../hair-follow'
import { HAIR_STILL, HAIR_STYLES, hairHangs, resolveHair, type HairStyleName } from './hair'
import { sampleHairLock } from './hair-lock'
import { capabilities } from '../capabilities'
import { characterScript } from '../acting/character-script'
import { deserializeTimeline, Timeline } from '../../engine'

const STYLES: HairStyleName[] = ['softSweep', 'flowingBob', 'cascadingWaves']
const moving = { swing: 35, trail: 0.7, lift: 0.3 }

function render(style: HairStyleName, turn = 0, motion = HAIR_STILL, look: 'clean' | 'pencil' | 'silhouette' = 'clean') {
  const canvas = createCanvas(320, 420)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  const who = character({ height: 300, lineWidth: 2, hair: { style, color: '#804020' }, skin: '#f2cfb1', look })
  drawCharacterHead(ctx, who, humanPose({ turn, 'hair.swing': motion.swing, 'hair.trail': motion.trail, 'hair.lift': motion.lift }), { x: 160, y: 110, radius: 65, time: 1200 })
  return canvas
}

describe('flowing hairstyles', () => {
  it('are discoverable, serializable presets with independently owned lock paths', () => {
    for (const style of STYLES) {
      expect(capabilities().character.hair).toContain(style)
      const hair = resolveHair(style)
      expect(JSON.parse(JSON.stringify(hair))).toEqual(hair)
      expect(hair.locks!.length).toBeGreaterThan(0)
      const before = JSON.stringify(HAIR_STYLES[style])
      hair.locks![0].path[0].up = 0.2
      if (hair.fall) hair.fall.taper = 0
      expect(JSON.stringify(HAIR_STYLES[style])).toBe(before)
      expect(resolveHair({ style, locks: [] }).locks).toEqual([])
    }
  })

  it('rejects malformed curves before rendering', () => {
    const path = resolveHair('softSweep').locks![0].path
    expect(() => resolveHair({ locks: [{ width: 0.5, path: path.slice(0, 3) }] })).toThrow(/cubic/)
    expect(() => resolveHair({ locks: [{ width: -1, path }] })).toThrow(/width/)
    expect(() => resolveHair({ locks: [{ width: 0.5, follow: NaN, path }] })).toThrow(/follow/)
    expect(() => resolveHair({ locks: [{ width: 0.5, path: [{ around: 0, up: -1 }, ...path.slice(1)] }] })).toThrow(/root/)
    expect(() => resolveHair({ locks: [{ width: 0.5, path: [path[0], { around: Infinity, up: 0.8 }, ...path.slice(2)] }] })).toThrow(/finite/)
    expect(() => resolveHair({ shine: 2 })).toThrow(/shine/)
    expect(() => resolveHair({ fall: { taper: NaN, wave: 0 } })).toThrow(/fall/)
  })

  it('fits sweeps outside the scalp, pins every root and moves the ends', () => {
    for (const style of STYLES) {
      const hair = resolveHair(style)
      for (const lock of hair.locks!) {
        const still = sampleHairLock(lock, hair.volume, 0.02, HAIR_STILL)
        const bent = sampleHairLock(lock, hair.volume, 0.02, moving)
        expect(bent[0]).toEqual(still[0])
        expect(bent.at(-1)!.center).not.toEqual(still.at(-1)!.center)
        for (const sample of still) {
          if (sample.center[1] >= 0) expect(Math.hypot(...sample.center)).toBeGreaterThanOrEqual(1 + hair.volume + 0.02 - 1e-8)
          for (const point of [sample.center, sample.left, sample.right]) expect(point.every(Number.isFinite)).toBe(true)
        }
        const pinned = { ...lock, follow: 0 }
        expect(sampleHairLock(pinned, hair.volume, 0.02, moving)).toEqual(sampleHairLock(pinned, hair.volume, 0.02, HAIR_STILL))
      }
    }
  })

  it('keeps scalp centers and ribbon edges outside the skull at follow-through limits', () => {
    const extreme = { swing: 50, trail: 1.2, lift: -0.8 }
    const hair = resolveHair('softSweep')
    const lock = hair.locks![1]
    const samples = sampleHairLock(lock, hair.volume, 0.02, extreme)
    expect(Math.hypot(...samples.find(sample => sample.t === 0.95)!.center)).toBeGreaterThanOrEqual(1)
    expect(samples[0]).toEqual(sampleHairLock(lock, hair.volume, 0.02, HAIR_STILL)[0])
    for (const sample of samples) {
      for (const point of [sample.center, sample.left, sample.right]) {
        expect(Math.hypot(...point)).toBeGreaterThanOrEqual(1 - 1e-8)
      }
    }
    for (const style of STYLES) {
      const hair = resolveHair(style)
      for (const lock of hair.locks!) {
        for (const swing of [-50, 50]) {
          for (const trail of [-1.2, 1.2]) {
            for (const lift of [-0.8, 0.8]) {
              const bent = sampleHairLock(lock, hair.volume, 0.02, { swing, trail, lift })
              expect(bent[0]).toEqual(sampleHairLock(lock, hair.volume, 0.02, HAIR_STILL)[0])
              for (const sample of bent) {
                for (const point of [sample.center, sample.left, sample.right]) {
                  expect(point.every(Number.isFinite)).toBe(true)
                  expect(Math.hypot(...point)).toBeGreaterThanOrEqual(1 - 1e-8)
                }
              }
            }
          }
        }
      }
    }
  })

  it('preserves free hanging tips under follow-through', () => {
    for (const style of ['flowingBob', 'cascadingWaves'] as const) {
      const hair = resolveHair(style)
      const lock = hair.locks![0]
      const tip = lock.path.at(-1)!
      const motion = { swing: 50, trail: 1.2, lift: -0.8 }
      const weight = lock.follow ?? 1
      const angle = (tip.around - motion.swing * weight) * Math.PI / 180
      const radius = 1 + hair.volume + 0.02 + (tip.lift ?? 0)
      const center = sampleHairLock(lock, hair.volume, 0.02, motion).at(-1)!.center
      const expected = [Math.sin(angle) * radius, tip.up + motion.lift * weight, Math.cos(angle) * radius - motion.trail * weight]
      center.forEach((value, axis) => expect(value).toBeCloseTo(expected[axis], 12))
    }
    const lock = { width: 0.5, path: [0.7, 0, -1, -2.5].map(up => ({ around: 0, up })) }
    const tip = sampleHairLock(lock, 0.12, 0.02, { swing: 0, trail: 1.2, lift: 0 }).at(-1)!
    expect(tip.center[0]).toBe(0)
    expect(tip.center[1]).toBe(-2.5)
    expect(tip.center[2]).toBeCloseTo(-0.06, 12)
  })

  it('keeps scalp clearance continuous as follow-through passes a collapsed center', () => {
    for (const around of [0, -0.001, 0.001]) {
      const hair = resolveHair({ volume: 0.12, locks: [{
        width: 0.5, follow: 1,
        path: [-30, -20, -10, around].map(around => ({ around, up: 0 })),
      }] })
      const lock = hair.locks![0]
      const rest = sampleHairLock(lock, hair.volume, 0.02, HAIR_STILL)
      let previous = sampleHairLock(lock, hair.volume, 0.02, { swing: 0, trail: 1.13, lift: 0 })
      for (let step = 1; step <= 200; step++) {
        const samples = sampleHairLock(lock, hair.volume, 0.02, { swing: 0, trail: 1.13 + step * 0.0001, lift: 0 })
        expect(samples[0]).toEqual(rest[0])
        samples.forEach((sample, i) => {
          for (const side of ['center', 'left', 'right'] as const) {
            expect(sample[side].every(Number.isFinite)).toBe(true)
            expect(Math.hypot(...sample[side])).toBeGreaterThanOrEqual(1 - 1e-8)
            expect(Math.hypot(...sample[side].map((value, axis) => value - previous[i][side][axis]))).toBeLessThan(0.01)
          }
        })
        previous = samples
      }
      expect(previous.at(-1)!.center[2]).toBeGreaterThanOrEqual(1 - 1e-8)
    }
  })

  it('keeps skull contact smooth and handles zero clearance and collapsed centers', () => {
    const lock = { width: 0.5, path: Array.from({ length: 4 }, () => ({ around: 0, up: 0 })) }
    const radiusAt = (trail: number) => Math.hypot(...sampleHairLock(lock, 0.12, 0.02, { swing: 0, trail, lift: 0 }).at(-1)!.center)
    const delta = 1e-5
    for (const boundary of [0, 0.28]) {
      const before = (radiusAt(boundary) - radiusAt(boundary - delta)) / delta
      const after = (radiusAt(boundary + delta) - radiusAt(boundary)) / delta
      expect(Math.abs(after - before)).toBeLessThan(1e-3)
    }
    for (const sample of sampleHairLock(lock, 0, 0, { swing: 0, trail: 1, lift: 0 })) {
      for (const point of [sample.center, sample.left, sample.right]) {
        expect(point.every(Number.isFinite)).toBe(true)
        expect(Math.hypot(...point)).toBeGreaterThanOrEqual(1 - 1e-8)
      }
    }
  })

  it('lets separate locks flex by different amounts and keeps swing direction consistent', () => {
    const lock = resolveHair('cascadingWaves').locks![2]
    const still = sampleHairLock(lock, 0.15, 0, HAIR_STILL).at(-1)!.center
    const soft = sampleHairLock({ ...lock, follow: 1 }, 0.15, 0, { swing: 0, trail: 1, lift: 0 }).at(-1)!.center
    const firm = sampleHairLock({ ...lock, follow: 0.25 }, 0.15, 0, { swing: 0, trail: 1, lift: 0 }).at(-1)!.center
    expect(still[2] - soft[2]).toBeGreaterThan(still[2] - firm[2])
    const back = { ...lock, path: lock.path.map(point => ({ ...point, around: 180 })) }
    const swung = sampleHairLock(back, 0.15, 0, { swing: 30, trail: 0, lift: 0 }).at(-1)!.center
    expect(swung[0]).toBeGreaterThan(0) // toward the character's left at the back
  })

  it('bakes follow-through for short swept locks as well as longer styles', () => {
    const tracks = [{ id: 'head-turn', target: 'hero', property: 'head.turn', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 65 }] }]
    for (const style of STYLES) {
      const who = character({ hair: style })
      expect(hairHangs(who.head.hair!)).toBe(true)
      expect(hairFollowTracks('hero', tracks, who).map(track => track.property)).toContain('hair.swing')
    }
    const pinned = resolveHair({ style: 'softSweep', locks: resolveHair('softSweep').locks!.map(lock => ({ ...lock, follow: 0 })) })
    expect(hairHangs(pinned)).toBe(false)
  })

  it('follows scripted walking, facing and dialogue and survives timeline JSON playback', () => {
    const who = character({ height: 300, hair: 'cascadingWaves' })
    const script = characterScript('hero', who, [
      { do: 'walk', to: 300 }, { do: 'face', toward: 0 }, { do: 'say', say: 'Hello there!' },
    ], { from: 40 })
    const lag = hairFollowTracks('hero', script.tracks, who)
    expect(lag.some(track => track.keyframes.some(key => Math.abs(Number(key.value)) > 0.1))).toBe(true)
    const definition = { id: 'hair-story', tracks: [...script.tracks, ...lag] }
    const timeline = new Timeline(definition)
    const restored = deserializeTimeline(JSON.parse(JSON.stringify(timeline.toDefinition())))
    for (const time of [script.duration, 600, 0, 1100]) {
      const expected = Object.fromEntries(timeline.getStateAtTime(time).values.get('hero')!)
      expect(Object.fromEntries(restored.getStateAtTime(time).values.get('hero')!)).toEqual(JSON.parse(JSON.stringify(expected)))
    }
  })

  it('keeps the face clear, covers the back and changes the visible silhouette in motion', () => {
    const at = (style: HairStyleName, turn: number) => Array.from(render(style, turn).getContext('2d').getImageData(160, 124, 1, 1).data.slice(0, 3))
    for (const style of STYLES) {
      expect(at(style, 0)).toEqual([242, 207, 177])
      expect(at(style, 2)).toEqual([128, 64, 32])
      expect(render(style, 1, moving).toBuffer('image/png').equals(render(style, 1).toBuffer('image/png'))).toBe(false)
    }
  })

  const cases = STYLES.flatMap(style => (['clean', 'pencil', 'silhouette'] as const).map(look => ({ style, look })))
  it.each(cases)('renders $style deterministically in $look after seeking', ({ style, look }) => {
    for (const turn of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]) {
      const before = render(style, turn, moving, look).toBuffer('image/png')
      render(style, 3.9, HAIR_STILL, look)
      expect(render(style, turn, moving, look).toBuffer('image/png').equals(before)).toBe(true)
    }
  })
})
