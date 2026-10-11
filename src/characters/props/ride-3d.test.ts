import { describe, it, expect } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { mat4, type Vec3 } from '../../engine/math'
import { propScript3D } from './script-3d'
import { pedallingKeys, pedallingPose, propRide3D, RIDING_POSES } from './ride-3d'
import { propAnchors3D } from './rig'
import { horse } from './families/animals'
import { character, characterPartsInView } from '../character'
import { characterScript3D } from '../character-script-3d'
import { stagePlanSpace } from '../rig/skeleton'
import { HUMAN_REST } from '../species/human'

describe('riding in 3D', () => {
  const prop = horse()
  const script = propScript3D('horse', prop, [{ do: 'walk', to: [6, 0] }], { scene: 's', position: [0, 0], heading: 90 })
  const ride = propRide3D({
    prop, propId: 'horse', propTracks: script.tracks, scene: 's', placement: { position: [0, 0, 0], heading: 90 },
    anchor: 'saddle', riderId: 'tum', pose: RIDING_POSES.astride, start: 0, end: script.duration, mount: { from: [0, 1] }, dismount: { to: [6, 1] },
  })
  const riderAt = (time: number) => Object.fromEntries(new Timeline({ id: 'r', tracks: ride }).getStateAtTime(time).values.get('s/tum') ?? []) as Record<string, number>
  const horseAt = (time: number) => Object.fromEntries(new Timeline({ id: 'h', tracks: script.tracks }).getStateAtTime(time).values.get('s/horse') ?? []) as Record<string, number>

  it('keeps the rider’s hips on the saddle as the horse walks and bobs', () => {
    const who = character({ height: 1 })
    const hip = stagePlanSpace(who.plan, { ...HUMAN_REST, ...RIDING_POSES.astride }, { height: 1.7, contact: who.contact }).hip
    for (const time of [script.duration * 0.3, script.duration * 0.5, script.duration * 0.7]) {
      const h = horseAt(time)
      const saddle = propAnchors3D(prop.rig, h).saddle
      const world = mat4.transformPoint(mat4.multiply(mat4.translation([h.x, 0, h.z]), mat4.fromQuat([0, Math.sin((h.rotateY * Math.PI) / 360), 0, Math.cos((h.rotateY * Math.PI) / 360)])), saddle)
      const r = riderAt(time)
      const hips = mat4.transformPoint(mat4.multiply(mat4.translation([r.x, r.y, r.z]), mat4.fromQuat([0, Math.sin((r.rotateY * Math.PI) / 360), 0, Math.cos((r.rotateY * Math.PI) / 360)])), hip as Vec3)
      for (const k of [0, 1, 2]) expect(hips[k]).toBeCloseTo(world[k], 1)
      expect(r.rotateY).toBeCloseTo(h.rotateY)
    }
  })

  it('hops on from the ground and off onto it', () => {
    expect(riderAt(0).x).toBeCloseTo(0)
    expect(riderAt(0).z).toBeCloseTo(1)
    expect(riderAt(0).y).toBeCloseTo(0)
    expect(riderAt(script.duration).x).toBeCloseTo(6)
    expect(riderAt(script.duration).z).toBeCloseTo(1)
    expect(riderAt(script.duration).y).toBeCloseTo(0)
    expect(riderAt(script.duration / 2).y).toBeGreaterThan(0.3)
  })

  it('draws a character part by part with depths, so a far leg sorts behind a near one', () => {
    // Seen side-on from +x, a figure facing +z: its left leg (+x) is nearer.
    const view = { toView: ([x, y, z]: Vec3): Vec3 => [-z, y - 0.9, x - 5], toScreen: ([x, y, z]: Vec3) => ({ x: (x / -z) * 400, y: (-y / -z) * 400 }) }
    const parts = characterPartsInView(character({ height: 1 }), { ...HUMAN_REST, ...RIDING_POSES.astride }, view, { height: 1.7 })
    const depth = (id: string) => parts.find((p) => p.part === id)!.depth
    expect(depth('leg.left')).toBeGreaterThan(depth('leg.right'))
    // Metres: about 5 m from the eye.
    expect(Math.abs(depth('spine') + 5)).toBeLessThan(0.5)
  })

  it('places a character at once where a ride left it', () => {
    const result = characterScript3D('tum', [{ do: 'hold', for: 500 }, { do: 'place', to: [4, 2], toward: 180 }, { do: 'hold', for: 500 }], { scene: 's' })
    const state = (time: number) => Object.fromEntries(new Timeline({ id: 'p', tracks: result.tracks }).getStateAtTime(time).values.get('s/tum') ?? []) as Record<string, number>
    expect(state(400).x).toBeCloseTo(0)
    expect(state(502).x).toBeCloseTo(4)
    expect(state(502).z).toBeCloseTo(2)
    expect(state(502).rotateY).toBeCloseTo(180)
  })
})

describe('rider poses', () => {
  it('drive with the hands forward on a wheel, and cycle the legs round the pedals', () => {
    expect(RIDING_POSES.driving['arm.left.swing']).toBeGreaterThan(40)
    expect(RIDING_POSES.driving['arm.right.elbow']).toBeGreaterThan(20)
    const top = pedallingPose(0)
    const half = pedallingPose(0.5)
    // Half a turn on, the legs have swapped places.
    expect(top['leg.left.swing']).toBeCloseTo(half['leg.right.swing'], 6)
    expect(top['leg.left.knee']).toBeCloseTo(half['leg.right.knee'], 6)
    expect(top['leg.left.swing']).not.toBeCloseTo(top['leg.right.swing'], 1)
    // The upper body keeps the cycling pose.
    expect(top.lean).toBe(RIDING_POSES.cycling.lean)
    expect(pedallingPose(1)['leg.left.swing']).toBeCloseTo(top['leg.left.swing'], 6)
  })

  it('wheel a wheelchair: seated, the hands down at the rims', () => {
    expect(RIDING_POSES.wheeling['leg.left.swing']).toBe(RIDING_POSES.seated['leg.left.swing'])
    expect(RIDING_POSES.wheeling['arm.left.swing']).toBeLessThan(RIDING_POSES.seated['arm.left.swing']!)
  })

  it('key a stretch of pedalling at a cadence, timed as written', () => {
    const keys = pedallingKeys({ start: 1000, end: 3000, cadence: 1 })
    expect(keys[0].time).toBe(1000)
    expect(keys[keys.length - 1].time).toBe(3000)
    expect(keys.length).toBe(17)
    expect(keys.slice(1).every((key) => key.act === false)).toBe(true)
    // One turn later the legs are back where they started.
    expect((keys[8].pose as Record<string, number>)['leg.left.swing']).toBeCloseTo((keys[0].pose as Record<string, number>)['leg.left.swing'], 6)
  })
})
