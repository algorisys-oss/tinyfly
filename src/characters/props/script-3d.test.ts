import { describe, it, expect } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { propScript3D, checkPropBeats3D } from './script-3d'
import { car } from './families/vehicle'
import { horse, dog, cat } from './families/animals'
import { crow, chicken } from './families/birds'

const at = (result: ReturnType<typeof propScript3D>, target: string) => {
  const timeline = new Timeline({ id: 't', tracks: result.tracks })
  return (time: number) => Object.fromEntries(timeline.getStateAtTime(time).values.get(target) ?? []) as Record<string, number>
}

describe('propScript3D', () => {
  it('drives to a point, turning to face it first, its wheels rolling exactly the distance at every moment', () => {
    const prop = car()
    const result = propScript3D('car', prop, [{ do: 'drive', to: [6, 8] }], { scene: 's', position: [0, 0], heading: 0 })
    const state = at(result, 's/car')
    const end = state(result.duration)
    expect(end.x).toBeCloseTo(6)
    expect(end.z).toBeCloseTo(8)
    const heading = (Math.atan2(6, 8) * 180) / Math.PI
    expect(end.rotateY).toBeCloseTo(heading)
    // Turned before it set off: still at the start, already facing the point.
    const setOff = result.beats[0].start + Math.max(220, (heading * 800) / 180)
    expect(state(setOff).x).toBeCloseTo(0)
    expect(state(setOff).rotateY).toBeCloseTo(heading)
    // Wheels in step with the ground all the way (they are keyed together, so between keys too).
    const perMetre = 180 / (Math.PI * prop.wheelRadius!)
    for (let time = setOff; time <= result.duration; time += 97) {
      const now = state(time)
      expect(now.wheelSpin).toBeCloseTo(Math.hypot(now.x, now.z) * perMetre, 6)
    }
    expect(end.wheelSpin).toBeCloseTo(10 * perMetre, 6)
  })

  it('follows a path through points, facing along it, its stride keyed with the distance', () => {
    const prop = horse()
    const through: Array<[number, number]> = [[4, 0], [4, 4], [0, 4]]
    const result = propScript3D('horse', prop, [{ do: 'walk', through }], { scene: 's', position: [0, 0], heading: 90 })
    const state = at(result, 's/horse')
    const frames = result.tracks.find((t) => t.property === 'x')!.keyframes!.length
    expect(frames).toBeGreaterThan(30)
    // It passes through each point.
    const samples = Array.from({ length: 400 }, (_, i) => state((result.duration * i) / 399))
    for (const [px, pz] of through) expect(Math.min(...samples.map((s) => Math.hypot(s.x - px, s.z - pz)))).toBeLessThan(0.05)
    // Walking eased in and out, gait set to walk; the stride phase advances with the distance along the path.
    expect(samples[200].walking).toBeCloseTo(1)
    expect(samples[399].walking).toBeCloseTo(0)
    expect(samples[200].gait).toBe(0)
    let walked = 0
    for (let i = 1; i < samples.length; i++) walked += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z)
    expect(samples[399].walk / prop.moves!.walk.perMetre!.walk).toBeCloseTo(walked, 1)
    // It ends facing along the path's last stretch (toward −x).
    expect(((samples[399].rotateY % 360) + 360) % 360).toBeCloseTo(270, -1)
  })

  it('flies at a height with wings beating, stays up between flights, and lands with them still', () => {
    const result = propScript3D('crow', crow(), [
      { do: 'fly', to: [5, 0], height: 3 },
      { do: 'fly', to: [5, 5], height: 3 },
      { do: 'fly', to: [0, 5], height: 0 },
    ], { scene: 's', position: [0, 0], heading: 90 })
    const state = at(result, 's/crow')
    const [first, second, third] = result.beats
    expect(state(first.end).lift).toBeCloseTo(3)
    expect(state((second.start + second.end) / 2).flapping).toBeCloseTo(1)
    expect(state((second.start + second.end) / 2).lift).toBeCloseTo(3)
    expect(state(third.end).lift).toBeCloseTo(0)
    expect(state(third.end).flapping).toBeCloseTo(0)
    // Four wingbeats a second, whatever the distance.
    expect(state(first.end).wingbeat - state(first.start).wingbeat).toBeCloseTo(((first.end - first.start) / 1000) * 4, 1)
  })

  it('plays its other actions as in 2D, controls only, and faces what it is told to', () => {
    const result = propScript3D('dog', dog(), [{ do: 'bark' }, { do: 'face', toward: [-5, 0] }, { do: 'wag', for: 600 }], { scene: 's', position: [0, 0], heading: 0 })
    const properties = new Set(result.tracks.map((t) => t.property))
    expect(properties.has('neck')).toBe(true)
    expect(properties.has('wag')).toBe(true)
    expect(properties.has('turn')).toBe(false)
    expect(properties.has('facing')).toBe(false)
    expect(at(result, 's/dog')(result.duration).rotateY).toBeCloseTo(-90)
    expect(result.tracks.every((t) => t.target === 's/dog')).toBe(true)
  })

  it('checks its beats, naming what was probably meant', () => {
    expect(checkPropBeats3D([{ do: 'drve', to: [1, 1] }], car())[0].message).toMatch(/Unknown car 3D beat "drve": did you mean "drive"\?/)
    expect(checkPropBeats3D([{ do: 'turn', toward: 1 }], car())[0].message).toMatch(/did you mean "face"/)
    expect(checkPropBeats3D([{ do: 'drive', to: 5 }], car())[0].message).toMatch(/\[x, z\] metres/)
    expect(checkPropBeats3D([{ do: 'walk' }], horse())[0].message).toMatch(/needs `to`/)
    expect(checkPropBeats3D([{ do: 'walk', path: [[1, 1]] }], horse())[0].message).toMatch(/did you mean "through"/)
    // A 2D move across the stage is not a 3D beat: a cat pounces in 2D; a chicken cannot fly.
    expect(checkPropBeats3D([{ do: 'pounce', to: [1, 1] }], cat())[0].message).toMatch(/Unknown cat 3D beat "pounce"/)
    expect(checkPropBeats3D([{ do: 'fly', to: [1, 1] }], chicken())[0].message).toMatch(/Unknown chicken 3D beat "fly"/)
    expect(() => propScript3D('car', car(), [{ do: 'drve', to: [1, 1] }], { scene: 's' })).toThrow(/beat 0/)
  })
})
