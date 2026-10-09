import { describe, it, expect } from 'vitest'
import { deserializeTimeline } from '../../engine'
import { cat, crow, dog, horse, cow, lyingPose } from './index'
import { propScript } from './script'

const valueAt = (tracks: ReturnType<typeof propScript>['tracks'], id: string, property: string, time: number) =>
  deserializeTimeline({ id: 't', config: { duration: 1e5 }, tracks }).getStateAtTime(time).values.get(id)?.get(property)

describe('four-legged animals lie down', () => {
  for (const make of [dog, cat, horse, cow]) {
    it(`${make.name}: lowers its body, front legs forward, and gets up again`, () => {
      const prop = make()
      expect(prop.actions.lie).toBeDefined()
      const script = propScript('a', prop, [{ do: 'lie', for: 1500 }], { from: 100, ground: 300, scale: 60 })
      const lying = valueAt(script.tracks, 'a', 'lift', script.beats[0].contact!)
      expect(lying).toBeLessThan(0)
      expect(valueAt(script.tracks, 'a', 'fl.swing', script.beats[0].contact!)).toBeGreaterThan(45)
      expect(valueAt(script.tracks, 'a', 'lift', script.duration)).toBeCloseTo(0, 6)
    })
  }

  it('is plain numbers: no pitch, and the hind legs folded', () => {
    const pose = lyingPose({ upper: 0.2, lower: 0.2, foot: 0.05, legLength: 0.45, tailHangs: false })
    expect(pose.pitch).toBe(0)
    expect(pose['hl.knee']).toBeLessThan(-120)
  })
})

describe('birds glide', () => {
  it('stop beating their wings and sink toward `height` on the way to `to`', () => {
    const script = propScript('c', crow(), [{ do: 'glide', to: 900, height: 0.5 }], { from: 100, ground: 300, scale: 80 })
    const beat = script.beats[0]
    const mid = (beat.contact! + beat.release!) / 2
    expect(valueAt(script.tracks, 'c', 'flapping', mid)).toBe(0)
    expect(valueAt(script.tracks, 'c', 'lift', beat.release!)).toBeCloseTo(0.5, 6)
    expect(valueAt(script.tracks, 'c', 'lift', mid)).toBeGreaterThan(0.5)
  })
})
