import { describe, it, expect } from 'vitest'
import { deserializeTimeline } from '../../engine'
import { cat, dog, horse } from './index'
import { propScript } from './script'

const valueAt = (tracks: ReturnType<typeof propScript>['tracks'], id: string, property: string, time: number) =>
  deserializeTimeline({ id: 't', config: { duration: 1e5 }, tracks }).getStateAtTime(time).values.get(id)?.get(property)

describe('four-legged animals’ ears follow through', () => {
  for (const make of [dog, cat, horse]) {
    it(`${make.name}: lays its ears back on a run, then they settle`, () => {
      const prop = make()
      expect(prop.rig.controls.ears).toBeDefined()
      const script = propScript('a', prop, [{ do: make === horse ? 'gallop' : 'run', to: 700 }], { from: 100, ground: 300, scale: 60, start: { turn: 1 } })
      expect(script.tracks.some((track) => track.property === 'ears')).toBe(true)
      const mid = (script.beats[0].start + script.beats[0].end) / 2
      expect(Number(valueAt(script.tracks, 'a', 'ears', mid))).toBeLessThan(-5)
      expect(Math.abs(Number(valueAt(script.tracks, 'a', 'ears', script.duration + 1400)))).toBeLessThan(1)
    })
  }

  it('is a control that turns both ears about their base', () => {
    const control = dog().rig.controls.ears
    expect(control.bind?.[0].parts).toEqual(['ear-left', 'ear-right'])
    expect(control.bind?.[0].rotate?.pivot?.[1]).toBeLessThan(0)
  })
})
