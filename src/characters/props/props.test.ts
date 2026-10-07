import { describe, it, expect } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { springFollow } from '../../engine/authoring/spring-follow'
import { describeTarget } from '../../adapters/canvas/target-properties'
import { boxMesh, cylinderMesh, extrudeMesh } from './shapes'
import { propView, solveProp, type PropRig } from './rig'
import { car } from './families/vehicle'
import { propTarget, propAt, solveAt } from './target'
import { propScript, checkPropBeats } from './script'
import { propRide, spliceTracks } from './ride'

const centroid = (points: number[][]) => points[0].map((_, axis) => points.reduce((sum, p) => sum + p[axis], 0) / points.length)

describe('prop shapes', () => {
  it('give every face an outward normal', () => {
    for (const mesh of [boxMesh([2, 1, 3]), cylinderMesh(0.5, 0.3, 'x', 12), extrudeMesh([[-1, 0], [1, 0], [1, 1], [-1, 1]], 1)]) {
      const middle = centroid(mesh.vertices)
      for (const face of mesh.faces) {
        const at = centroid(face.corners.map((c) => mesh.vertices[c]))
        const out = at.map((v, i) => v - middle[i])
        expect(out[0] * face.normal[0] + out[1] * face.normal[1] + out[2] * face.normal[2]).toBeGreaterThan(0)
      }
    }
  })

  it('runs an extrusion either way round', () => {
    const forward = extrudeMesh([[-1, 0], [1, 0], [1, 1], [-1, 1]], 1)
    const backward = extrudeMesh([[-1, 1], [1, 1], [1, 0], [-1, 0]], 1)
    expect(backward.faces.map((f) => f.normal)).toEqual(expect.arrayContaining(forward.faces.map((f) => f.normal)))
  })

  it('puts spokes on a cylinder’s ends', () => {
    expect(cylinderMesh(0.4, 0.2, 'x', 12, 5).marks).toHaveLength(10)
  })
})

const cube: PropRig = { parts: [{ id: 'cube', shape: { type: 'box', size: [1, 1, 1] }, at: [0, 0.5, 0], fill: '#888888' }], controls: {}, length: 1, height: 1 }

describe('solving a prop in a view', () => {
  it('shows the faces that face the viewer: one from the front, three from above at ¾', () => {
    expect(solveProp(cube, {}, propView(0, 0, 10), 10).under[0].faces).toHaveLength(1)
    expect(solveProp(cube, {}, propView(0.5, 20, 10), 10).under[0].faces).toHaveLength(3)
  })

  it('outlines the silhouette and the creases between seen faces', () => {
    const [part] = solveProp(cube, {}, propView(0.5, 20, 10), 10).under
    const corners = new Set(part.edges.flat().map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`))
    expect(corners.size).toBe(7)
  })

  it('squashes about the ground, keeping volume', () => {
    const height = (values: Record<string, number>) => {
      const ys = solveProp(cube, values, propView(0, 0, 100), 100).under[0].faces.flatMap((f) => f.points.map((p) => p.y))
      const xs = solveProp(cube, values, propView(0, 0, 100), 100).under[0].faces.flatMap((f) => f.points.map((p) => p.x))
      return { top: Math.min(...ys), bottom: Math.max(...ys), width: Math.max(...xs) - Math.min(...xs) }
    }
    const squashed = height({ squash: 0.5 })
    expect(squashed.bottom).toBeCloseTo(0)
    expect(-squashed.top).toBeCloseTo(50)
    expect(squashed.width).toBeCloseTo(100 * Math.SQRT2)
  })

  it('turns a car toward the camera: side-on its right side shows, front-on its lights do', () => {
    const prop = car()
    const shown = (turn: number) => [...solveAt(prop, { turn, tilt: 10 }, 40).under, ...solveAt(prop, { turn, tilt: 10 }, 40).over].map((p) => p.part.id)
    expect(shown(1)).toContain('door-right')
    expect(shown(1)).not.toContain('door-left')
    expect(shown(0)).toContain('headlight-1')
    expect(shown(0)).not.toContain('taillight-1')
    expect(shown(2)).toContain('taillight-1')
  })

  it('moves anchors with the prop', () => {
    const prop = car()
    const ground = solveAt(prop, { turn: 1, tilt: 0 }, 50).anchors.seat.point
    const lifted = solveAt(prop, { turn: 1, tilt: 0, lift: 1 }, 50).anchors.seat.point
    expect(lifted.y - ground.y).toBeCloseTo(-50)
  })

  it('casts a contact shadow that shrinks as it lifts', () => {
    const prop = car()
    expect(solveAt(prop, { lift: 1 }, 50).shadow.opacity).toBeLessThan(solveAt(prop, {}, 50).shadow.opacity)
  })
})

describe('propScript', () => {
  const prop = car()
  const sampler = (result: ReturnType<typeof propScript>) => {
    const timeline = new Timeline({ id: 't', tracks: result.tracks })
    return (time: number, property: string) => (timeline.getStateAtTime(time).values.get('car')?.get(property) as number) ?? 0
  }

  it('drives with wheels that roll exactly the distance', () => {
    const result = propScript('car', prop, [{ do: 'drive', to: 400 }], { from: 100, scale: 50, start: { turn: 1 } })
    const at = sampler(result)
    const radius = 0.4
    for (const time of [300, 600, 900, 1200, result.duration]) {
      const metres = (at(time, 'x') - at(0, 'x')) / 50
      expect(at(time, 'wheelSpin')).toBeCloseTo((metres / radius) * (180 / Math.PI), 4)
    }
    expect(at(result.duration, 'x')).toBeCloseTo(300)
  })

  it('winds up (rolls back first), dips its nose on the stop, and settles', () => {
    const result = propScript('car', prop, [{ do: 'drive', to: 400 }], { from: 100, scale: 50, start: { turn: 1 } })
    const at = sampler(result)
    const drive = result.beats[0]
    expect(at(drive.contact!, 'x')).toBeLessThan(0)
    const pitches = Array.from({ length: 40 }, (_, i) => at(drive.release! - 100 + i * 20, 'pitch'))
    expect(Math.min(...pitches)).toBeLessThan(-3)
    expect(at(result.duration + 600, 'pitch')).toBeCloseTo(0, 0)
  })

  it('turns round to drive the other way, through facing the camera', () => {
    const result = propScript('car', prop, [{ do: 'drive', to: -200 }], { scale: 50, start: { turn: 1 } })
    const at = sampler(result)
    const turns = Array.from({ length: 30 }, (_, i) => at(i * 50, 'turn'))
    expect(Math.min(...turns)).toBeLessThan(-0.95)
    expect(turns.some((t) => Math.abs(t) < 0.2)).toBe(true)
  })

  it('locks the wheels for a skid when braking, and leaves skid marks', () => {
    const result = propScript('car', prop, [{ do: 'brake', to: 400 }], { scale: 50, start: { turn: 1 } })
    const at = sampler(result)
    const span = result.beats[0]
    expect(at(span.release!, 'wheelSpin')).toBeCloseTo(at(span.contact!, 'wheelSpin'), 3)
    expect(at(span.release!, 'x')).toBeGreaterThan(at(span.contact!, 'x') + 20)
    expect(result.effects.find((e) => e.kind === 'skid')).toMatchObject({ toX: 400 })
  })

  it('trails the antenna on a spring, and it settles', () => {
    const result = propScript('car', prop, [{ do: 'drive', to: 400 }, { do: 'hold', for: 2000 }], { scale: 50, start: { turn: 1 } })
    const at = sampler(result)
    const bends = Array.from({ length: 40 }, (_, i) => at(300 + i * 50, 'antenna'))
    expect(Math.min(...bends)).toBeLessThan(-5)
    expect(Math.abs(at(result.duration, 'antenna'))).toBeLessThan(1)
  })

  it('scales the wind-up with exaggeration', () => {
    const backOf = (exaggeration: number) => {
      const result = propScript('car', prop, [{ do: 'drive', to: 400 }], { scale: 50, start: { turn: 1 }, exaggeration })
      return sampler(result)(result.beats[0].contact!, 'x')
    }
    expect(backOf(2)).toBeLessThan(backOf(1))
    expect(backOf(1)).toBeLessThan(backOf(0.5))
  })

  it('checks beats with suggestions', () => {
    const messages = checkPropBeats([{ do: 'drvie', to: 1 }, { do: 'drive' }, { do: 'turn', toward: 'veiwer' }, { do: 'door', open: 'yes' }, { do: 'honk', duration: 3 }], prop).map((p) => p.message)
    expect(messages[0]).toMatch(/Unknown car action "drvie": did you mean "drive"\?/)
    expect(messages[1]).toMatch(/`drive` needs `to`/)
    expect(messages[2]).toMatch(/did you mean "viewer"/)
    expect(messages[3]).toMatch(/`open` is true or false/)
    expect(messages[4]).toMatch(/"duration": did you mean "for"/)
    expect(() => propScript('car', prop, [{ do: 'fly' }])).toThrow(/Unknown car action "fly"/)
  })
})

describe('prop targets', () => {
  it('describe their controls and actions', () => {
    const described = describeTarget(propTarget({ x: 0, y: 0, prop: car() }))
    expect(described.kind).toBe('car')
    expect(described.properties.find((p) => p.name === 'turn')?.unit).toBe('quarter turns')
    expect(described.properties.find((p) => p.name === 'wheelSpin')?.unit).toBe('degrees')
    expect(Object.keys(described.actions ?? {})).toEqual(expect.arrayContaining(['drive', 'brake', 'bump', 'honk', 'door', 'lights']))
  })

  it('carry a rider at an anchor, turning it with the prop', () => {
    const prop = car()
    const target = propTarget({ x: 200, y: 300, prop, scale: 50, values: { turn: 1 } })
    const script = propScript('car', prop, [{ do: 'drive', to: 400 }, { do: 'turn', toward: 'viewer' }], { from: 200, ground: 300, scale: 50, start: { turn: 1 } })
    const ride = propRide({ prop: target, propId: 'car', propTracks: script.tracks, anchor: 'seat', figure: { x: 0, y: 300 }, figureId: 'hero', start: 0, end: script.duration })
    const timeline = new Timeline({ id: 'r', tracks: [...script.tracks, ...ride] })
    for (const time of [0, 800, script.duration]) {
      const state = timeline.getStateAtTime(time)
      const seat = propAt(target, { time, state }, 'car').anchor('seat')
      expect(state.values.get('hero')?.get('x')).toBeCloseTo(seat.x, 0)
    }
    // The turn overshoots a little and settles toward front-on.
    expect(timeline.getStateAtTime(script.duration).values.get('hero')?.get('turn')).toBeLessThan(0.2)
  })

  it('splice a ride into a script’s tracks', () => {
    const base = [{ id: 'a', target: 'hero', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 5 }, { time: 2000, value: 9 }] }]
    const spliced = spliceTracks(base, [{ id: 'b', target: 'hero', property: 'x', keyframes: [{ time: 400, value: 1 }, { time: 900, value: 2 }] }, { id: 'c', target: 'hero', property: 'y', keyframes: [{ time: 400, value: 3 }] }], { from: 400, to: 900 })
    expect(spliced[0].keyframes.map((k) => k.time)).toEqual([0, 400, 900, 2000])
    expect(spliced).toHaveLength(2)
  })
})

describe('springFollow', () => {
  it('lags a step, overshoots, settles, and is the same every time', () => {
    const step = (t: number) => (t < 100 ? 0 : 100)
    const keys = springFollow(step, { start: 0, end: 3000 })
    const value = (time: number) => keys.reduce((best, k) => (Math.abs(k.time - time) < Math.abs(best.time - time) ? k : best)).value
    expect(value(150)).toBeLessThan(50)
    expect(Math.max(...keys.map((k) => k.value))).toBeGreaterThan(100)
    expect(value(3000)).toBeCloseTo(100, 0)
    expect(springFollow(step, { start: 0, end: 3000 })).toEqual(keys)
  })
})

describe('environment props', () => {
  it('a tree sways with its canopy trailing the trunk, and sheds leaves in a strong wind', async () => {
    const { tree } = await import('./families/environment')
    const prop = tree()
    const result = propScript('tree', prop, [{ do: 'sway', wind: 0.8, for: 2600 }], { scale: 40 })
    const timeline = new Timeline({ id: 't', tracks: result.tracks })
    const at = (time: number, property: string) => (timeline.getStateAtTime(time).values.get('tree')?.get(property) as number) ?? 0
    // The canopy's bend is the trunk's a step earlier, further: it trails.
    expect(Math.abs(at(1300, 'canopySway'))).toBeGreaterThan(0)
    expect(at(1300 + 260, 'canopySway')).toBeCloseTo(at(1300, 'sway') * 1.3, 0)
    expect(result.effects.filter((e) => e.kind === 'leaves').length).toBeGreaterThan(1)
    expect(at(result.duration + 800, 'sway')).toBeCloseTo(0, 0)
  })

  it('a house opens its door, lights its windows and smokes from its chimney', async () => {
    const { house } = await import('./families/environment')
    const prop = house()
    const target = propTarget({ x: 300, y: 400, prop, scale: 30 })
    const result = propScript('house', prop, [{ do: 'door', open: true }, { do: 'lights', on: true }, { do: 'smoke', for: 2000 }], { from: 300, ground: 400, scale: 30 })
    const timeline = new Timeline({ id: 'h', tracks: result.tracks })
    const state = timeline.getStateAtTime(result.duration)
    expect(state.values.get('house')?.get('door')).toBeCloseTo(1, 1)
    expect(state.values.get('house')?.get('lights')).toBe(1)
    const smoke = result.effects.find((e) => e.kind === 'smoke')!
    const chimney = propAt(target, { time: 0, state: timeline.getStateAtTime(0) }, 'house').anchor('chimney')
    expect(smoke.x).toBeCloseTo(chimney.x)
    expect(smoke.y).toBeCloseTo(chimney.y)
    // The open door shows the doorway behind it, front-on.
    const parts = solveAt(prop, { turn: 0, door: 1 }, 30)
    expect([...parts.under, ...parts.over].map((p) => p.part.id)).toContain('doorway')
  })

  it('every prop can pop in and vanish', () => {
    const result = propScript('car', car(), [{ do: 'pop' }, { do: 'hold', for: 300 }, { do: 'vanish' }], { scale: 50 })
    const timeline = new Timeline({ id: 'p', tracks: result.tracks })
    const size = (time: number) => timeline.getStateAtTime(time).values.get('car')?.get('size') as number
    expect(size(0)).toBe(0)
    expect(Math.max(...Array.from({ length: 20 }, (_, i) => size(i * 25)))).toBeGreaterThan(1)
    expect(size(result.duration)).toBe(0)
  })
})

describe('aircraft', () => {
  it('a helicopter spools up, lifts off, flies banked and nose-down, and lands with its rotor spooling down', async () => {
    const { helicopter } = await import('./families/aircraft')
    const prop = helicopter()
    const result = propScript('heli', prop, [{ do: 'takeOff', height: 2 }, { do: 'fly', to: 400 }, { do: 'hover', for: 1000 }, { do: 'land' }], { scale: 30, start: { turn: 1 } })
    const timeline = new Timeline({ id: 'h', tracks: result.tracks })
    const at = (time: number, property: string) => (timeline.getStateAtTime(time).values.get('heli')?.get(property) as number) ?? 0
    const [takeOff, fly, , land] = result.beats
    expect(at(takeOff.end, 'lift')).toBeCloseTo(2, 0)
    expect(at(takeOff.contact! - 300, 'squash')).toBeLessThan(1)
    const pitches = Array.from({ length: 20 }, (_, i) => at(fly.contact! + 300 + i * 30, 'pitch'))
    expect(Math.min(...pitches)).toBeLessThan(-5)
    expect(at(fly.release!, 'x')).toBeCloseTo(400, 0)
    // The rotor turns all the way through, slowing to a stop after landing.
    expect(at(land.contact!, 'rotor')).toBeGreaterThan(at(takeOff.end, 'rotor'))
    expect(at(land.end, 'rotor') - at(land.end - 100, 'rotor')).toBeLessThan(at(fly.release!, 'rotor') - at(fly.release! - 100, 'rotor'))
    expect(at(land.end, 'lift')).toBeCloseTo(0)
    expect(at(land.end, 'blur')).toBeCloseTo(0)
  })

  it('shows the rotor disc only while the blades blur', async () => {
    const { helicopter } = await import('./families/aircraft')
    const prop = helicopter()
    const ids = (blur: number) => [...solveAt(prop, { turn: 1.5, blur }, 30).under, ...solveAt(prop, { turn: 1.5, blur }, 30).over].map((p) => p.part.id)
    expect(ids(0)).not.toContain('rotor-disc')
    expect(ids(1)).toContain('rotor-disc')
  })
})

describe('vehicle presets and the airplane', () => {
  it('every preset solves in every view and lists its actions', async () => {
    const presets = await import('./families/vehicle')
    const { airplane } = await import('./families/aircraft')
    for (const make of [presets.car, presets.truck, presets.bus, presets.tractor, presets.cart, presets.trainCar, presets.bike, presets.motorbike, airplane]) {
      const prop = make()
      for (const turn of [0, 0.5, 1, 1.5, 2, 3]) {
        const solved = solveAt(prop, { turn, tilt: 12 }, 30)
        expect(solved.under.length + solved.over.length, `${prop.kind} turn ${turn}`).toBeGreaterThan(0)
      }
      expect(checkPropBeats([{ do: 'hold' }, { do: 'turn', toward: 'viewer' }], prop)).toEqual([])
    }
  })

  it('a tractor’s big and small wheels each roll the same distance', async () => {
    const { tractor } = await import('./families/vehicle')
    const prop = tractor()
    const bindings = prop.rig.controls.wheelSpin.bind!
    const rear = bindings.find((b) => b.parts[0] === 'wheel-0-left')!.rotate!.degrees
    const front = bindings.find((b) => b.parts[0] === 'wheel-1-left')!.rotate!.degrees
    // A turn of the reference (rear) wheel: the front, smaller, turns more, by the ratio of the radii.
    expect(rear).toBe(1)
    expect(front * 0.42).toBeCloseTo(rear * 0.78)
  })

  it('an airplane loops the loop: a circle in the air, its nose all the way round', async () => {
    const { airplane } = await import('./families/aircraft')
    const prop = airplane()
    const result = propScript('plane', prop, [{ do: 'loop', for: 1600 }], { scale: 20, start: { turn: 1, lift: 5, blur: 1 } })
    const timeline = new Timeline({ id: 'l', tracks: result.tracks })
    const at = (time: number, property: string) => (timeline.getStateAtTime(time).values.get('plane')?.get(property) as number) ?? 0
    expect(at(800, 'lift')).toBeGreaterThan(8)
    expect(at(800, 'pitch')).toBeCloseTo(180, -1)
    expect(at(1600, 'lift')).toBeCloseTo(5, 0)
    expect(at(1600, 'x')).toBeGreaterThan(0)
  })
})

describe('openings for riders', () => {
  it('an open car door shows a doorway, which a rider shows through', () => {
    const prop = car()
    const shut = solveAt(prop, { turn: 1, door: 0 }, 40)
    const open = solveAt(prop, { turn: 1, door: 1 }, 40)
    const ids = (s: typeof shut) => [...s.under, ...s.over].map((p) => p.part.id)
    expect(ids(open)).toContain('doorway-right')
    expect(ids(open)).toContain('seat-back-right')
    // The doorway is an opening, and the door (drawn over a rider) covers it when shut.
    expect(open.openings.length).toBeGreaterThan(shut.openings.length - 1)
    expect(shut.over.map((p) => p.part.id)).toContain('door-right')
  })
})

describe('horse', () => {
  it('moves its legs in each gait’s footfall pattern', async () => {
    const { horse } = await import('./families/animals')
    const prop = horse()
    const legs = (gait: number, walk: number) => ({ ...prop.rig.derive!({ walking: 1, gait, walk }) })
    // Trot: diagonal pairs move together (front left with hind right).
    const trot = legs(1, 0.1)
    expect(trot['fl.swing']).toBeCloseTo(trot['hr.swing'])
    expect(trot['fr.swing']).toBeCloseTo(trot['hl.swing'])
    expect(trot['fl.swing']).toBeCloseTo(-trot['fr.swing'])
    // Walk: four beats, every leg at its own point in the cycle.
    const walk = legs(0, 0.1)
    expect(new Set(['fl', 'fr', 'hl', 'hr'].map((l) => walk[`${l}.swing`].toFixed(3))).size).toBe(4)
    // Standing still, nothing is added.
    expect(prop.rig.derive!({ walking: 0, gait: 1, walk: 0.3 })).toEqual({})
  })

  it('keys its stride phase in step with the distance, whatever the gait', async () => {
    const { horse, horseStrideLength } = await import('./families/animals')
    const prop = horse()
    for (const [gait, stride] of [['walk', horseStrideLength('walk')], ['gallop', horseStrideLength('gallop')]] as const) {
      const result = propScript('horse', prop, [{ do: gait, to: 400 }], { scale: 50, start: { turn: 1 } })
      const timeline = new Timeline({ id: 'h', tracks: result.tracks })
      const at = (time: number, property: string) => (timeline.getStateAtTime(time).values.get('horse')?.get(property) as number) ?? 0
      for (const time of [200, 600, 1000, result.beats[0].release!]) {
        expect(at(time, 'walk')).toBeCloseTo(at(time, 'x') / 50 / stride, 4)
      }
    }
  })

  it('rears on its hind legs: they stay on the ground as the front comes up', async () => {
    const { horse } = await import('./families/animals')
    const prop = horse()
    const result = propScript('horse', prop, [{ do: 'rear' }], { scale: 50, start: { turn: 1 } })
    const timeline = new Timeline({ id: 'r', tracks: result.tracks })
    const values = (time: number) => Object.fromEntries(timeline.getStateAtTime(time).values.get('horse') ?? []) as Record<string, number>
    const top = solveAt(prop, { turn: 1, tilt: 0, ...values(600) }, 50)
    expect(values(600).pitch).toBeGreaterThan(25)
    const hoofDepths = top.under.filter((p) => p.part.id.startsWith('h') && p.part.id.endsWith('foot')).flatMap((p) => p.faces.flatMap((f) => f.points.map((pt) => pt.y)))
    // The hind hooves are still at the ground (screen y 0), within a few px.
    expect(Math.max(...hoofDepths)).toBeGreaterThan(-6)
    expect(Math.max(...hoofDepths)).toBeLessThan(8)
  })

  it('tows a cart: its shafts stay on the hitch and its wheels roll the distance', async () => {
    const { horse } = await import('./families/animals')
    const { cart } = await import('./families/vehicle')
    const { propTow } = await import('./ride')
    const horseProp = horse()
    const horseTarget = propTarget({ x: 300, y: 400, prop: horseProp, scale: 40, values: { turn: 1 } })
    const cartTarget = propTarget({ x: 160, y: 400, prop: cart(), scale: 40, values: { turn: 1 } })
    const script = propScript('horse', horseProp, [{ do: 'trot', to: 600 }], { from: 300, ground: 400, scale: 40, start: { turn: 1 } })
    const towed = propTow({ leader: horseTarget, leaderId: 'horse', leaderTracks: script.tracks, hitch: 'hitch', towed: cartTarget, towedId: 'cart', anchor: 'shafts', start: 0, end: script.duration })
    const timeline = new Timeline({ id: 't', tracks: [...script.tracks, ...towed] })
    for (const time of [0, 700, script.duration]) {
      const state = timeline.getStateAtTime(time)
      const hitch = propAt(horseTarget, { time, state }, 'horse').anchor('hitch')
      const shafts = propAt(cartTarget, { time, state }, 'cart').anchor('shafts')
      expect(shafts.x).toBeCloseTo(hitch.x, 0)
    }
    const at = (time: number, property: string) => timeline.getStateAtTime(time).values.get('cart')?.get(property) as number
    const metres = (at(script.duration, 'x') - at(0, 'x')) / 40
    expect(at(script.duration, 'wheelSpin') - at(0, 'wheelSpin')).toBeCloseTo((metres / 0.66) * (180 / Math.PI), 0)
  })
})

describe('dog, cat and cow', () => {
  it('sit with their front feet planted and their paws flat on the ground', async () => {
    const { dog, cat, cow, horse } = await import('./families/animals')
    for (const make of [dog, cat, cow, horse]) {
      const prop = make()
      const result = propScript('a', prop, [{ do: 'sit', for: 800 }], { scale: 100, start: { turn: 1 } })
      const timeline = new Timeline({ id: 's', tracks: result.tracks })
      const values = Object.fromEntries(timeline.getStateAtTime(result.beats[0].contact! + 300).values.get('a') ?? []) as Record<string, number>
      const solved = solveAt(prop, { turn: 1, tilt: 0, ...values }, 100)
      const parts = [...solved.under, ...solved.over]
      const feet = (prefix: string) => parts.filter((p) => p.part.id.startsWith(prefix) && p.part.id.endsWith('foot')).flatMap((p) => p.faces.flatMap((f) => f.points))
      for (const prefix of ['f', 'h']) {
        const points = feet(prefix)
        const bottom = Math.max(...points.map((p) => p.y))
        // Resting on the ground (screen y 0), within a couple of centimetres.
        expect(Math.abs(bottom), `${prop.kind} ${prefix}`).toBeLessThan(3)
        // Flat: not tipped toe-up (its height on screen stays near the foot's own height).
        const height = bottom - Math.min(...points.map((p) => p.y))
        expect(height, `${prop.kind} ${prefix} flat`).toBeLessThan(prop.kind === 'cat' ? 6 : 12)
      }
    }
  })

  it('each species has its own voice and actions, and gaits it does not have are refused', async () => {
    const { dog, cat, cow } = await import('./families/animals')
    expect(Object.keys(dog().actions)).toEqual(expect.arrayContaining(['walk', 'trot', 'run', 'bark', 'wag', 'sniff', 'sit', 'jump']))
    expect(Object.keys(cat().actions)).toEqual(expect.arrayContaining(['meow', 'arch', 'pounce', 'run']))
    expect(Object.keys(cow().actions)).toEqual(expect.arrayContaining(['moo', 'graze', 'walk', 'trot']))
    expect(checkPropBeats([{ do: 'gallop', to: 100 }], cow())[0].message).toMatch(/Unknown cow action "gallop"/)
  })

  it('a cat pounces to where it was told, landing with a squash', async () => {
    const { cat } = await import('./families/animals')
    const result = propScript('cat', cat(), [{ do: 'pounce', to: 300 }], { from: 100, scale: 150, start: { turn: 1 } })
    const timeline = new Timeline({ id: 'p', tracks: result.tracks })
    const at = (time: number, property: string) => timeline.getStateAtTime(time).values.get('cat')?.get(property) as number
    expect(at(result.beats[0].contact!, 'x')).toBeCloseTo(200)
    expect(at(result.beats[0].contact!, 'squash')).toBeLessThan(0.9)
  })
})

describe('the stick look', () => {
  it('gives tubes a centre line to stroke, and leaves solid-only rounding out', async () => {
    const { dog } = await import('./families/animals')
    const solved = solveAt(dog(), { turn: 1 }, 100)
    const parts = [...solved.under, ...solved.over]
    expect(parts.find((p) => p.part.id === 'fl-upper')?.spine?.length).toBe(3)
    expect(parts.find((p) => p.part.id === 'body')?.spine).toBeUndefined()
    expect(parts.find((p) => p.part.id === 'fl-knee')?.part.solidOnly).toBe(true)
  })
})

describe('birds', () => {
  const width = (solved: ReturnType<typeof solveAt>) => {
    const points = [...solved.under, ...solved.over].flatMap((p) => p.faces.flatMap((f) => f.points))
    return Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x))
  }

  it('fold their wings along the body and spread them out wide', async () => {
    const { crow } = await import('./families/birds')
    const prop = crow()
    // Seen from the front: folded, the bird is about as wide as its body; spread, its wings reach out past it.
    const folded = width(solveAt(prop, { turn: 0, tilt: 0 }, 100))
    const spread = width(solveAt(prop, { turn: 0, tilt: 0, spread: 1 }, 100))
    expect(folded).toBeLessThan(25)
    expect(spread).toBeGreaterThan(folded * 2.5)
  })

  it('beat their wings in rhythm while flying, up over the back and down below', async () => {
    const { crow } = await import('./families/birds')
    const prop = crow()
    const result = propScript('c', prop, [{ do: 'fly', to: 400, height: 1 }, { do: 'land' }], { from: 100, scale: 100, start: { turn: 1 } })
    const timeline = new Timeline({ id: 'f', tracks: result.tracks })
    const at = (time: number) => Object.fromEntries(timeline.getStateAtTime(time).values.get('c') ?? []) as Record<string, number>
    const fly = result.beats[0]
    // Four beats a second, keyed steadily from take-off to the end of the flight.
    const beats = at(fly.release!).wingbeat - at(fly.contact!).wingbeat
    expect(beats).toBeCloseTo(((fly.release! - fly.contact!) / 1000) * 4, 5)
    const flaps = Array.from({ length: 40 }, (_, i) => fly.contact! + 200 + i * 20).map((time) => prop.rig.derive!(at(time)).flap ?? 0)
    expect(Math.max(...flaps)).toBeGreaterThan(30)
    expect(Math.min(...flaps)).toBeLessThan(-30)
    expect(at(fly.release!).lift).toBeCloseTo(1)
    // Landed: on the ground, wings still and folded.
    const end = at(result.duration)
    expect(end.lift).toBeCloseTo(0)
    expect(end.flapping).toBeCloseTo(0)
    expect(end.spread).toBeCloseTo(0)
  })

  it('peck with the beak down toward the ground', async () => {
    const { chicken } = await import('./families/birds')
    const prop = chicken()
    const up = solveAt(prop, { turn: 1 }, 100).anchors.beak.point.y
    const down = solveAt(prop, { turn: 1, peck: 75, pitch: -20 }, 100).anchors.beak.point.y
    // Screen y grows downward, the ground is 0: the beak comes down to within a few centimetres of it.
    expect(up).toBeLessThan(-40)
    expect(down).toBeGreaterThan(-6)
  })

  it('each kind has its call; a chicken flutters but cannot fly', async () => {
    const { songbird, crow, chicken } = await import('./families/birds')
    expect(Object.keys(songbird().actions)).toEqual(expect.arrayContaining(['hop', 'walk', 'peck', 'flap', 'fly', 'land', 'tweet']))
    expect(Object.keys(crow().actions)).toContain('caw')
    expect(Object.keys(chicken().actions)).toEqual(expect.arrayContaining(['cluck', 'flutter']))
    expect(checkPropBeats([{ do: 'fly', to: 100 }], chicken())[0].message).toMatch(/Unknown chicken action "fly"/)
  })
})
