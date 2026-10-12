import { describe, it, expect } from 'vitest'
import { character, characterJoints } from './character'
import { HUMAN_DANCES, humanDanceFrame, humanDanceTracks, type HumanDanceName, type HumanDanceStyle } from './human-dance'
import { danceCircleAt, danceCircleTracks } from './dance-circle'
import { danceJoint, meetDandiya, plantDanceFoot, type DancePartner } from './dance-contact'
import { Timeline } from '../engine/core/timeline'
import { HAND_REST } from './hands/hand-rig'
import { HUMAN_REST } from './species/human'
import { stagePlanSpace } from './rig/skeleton'
import { characterObjects } from './scene-objects'
import { loadScene3D, resolveScene3D } from '../scene-3d'
import { mat4 } from '../engine/math'

const distance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]))

const sparseDance: HumanDanceStyle = {
  label: 'Sparse hands', bpm: 120, beats: 4, strikes: [],
  keys: [
    { beat: 0, pose: { 'hand.right.pinky.curl': 0.9 } },
    { beat: 1, pose: {} },
    { beat: 2, pose: { 'hand.left.index.curl': 1, 'hand.left.spread': 1, 'arm.left.elbow': 60, custom: 3 } },
    { beat: 3, pose: {} },
  ],
}

describe('native dance poses', () => {
  for (const name of Object.keys(HUMAN_DANCES) as HumanDanceName[]) {
    it(`${name}: loops and keeps the caller's full view`, () => {
      const who = character({ height: 1.7 })
      for (const turn of [0, 0.5, 1, 2, 3, 4, 8]) {
        for (let beat = 0; beat < 8; beat += 0.125) {
          const a = humanDanceFrame(name, beat, { turn })
          const b = humanDanceFrame(name, beat + 8, { turn })
          expect(a.pose.turn).toBe(turn)
          expect(a.pose).toEqual(b.pose)
          expect(Object.values(a.pose).every(Number.isFinite)).toBe(true)
          const joints = characterJoints(who, a.pose)
          expect(joints.head.center.y).toBeLessThan(joints.points.hip.y)
          expect(joints.groundY).toBeCloseTo(0, 8)
        }
      }
    })
  }
  it('evaluates identically when seeking backwards and round-tripping JSON', () => {
    const style = JSON.parse(JSON.stringify(HUMAN_DANCES.garba))
    const end = humanDanceFrame(style, 2.5)
    humanDanceFrame(style, 10)
    expect(humanDanceFrame(style, 2.5)).toEqual(end)
    expect(humanDanceFrame('dandiya', 3).strike).toBe(1)
    expect(humanDanceFrame('dandiya', 3.5).strike).toBe(0)
  })
  it('claps bring the hands together instead of waving parallel arms', () => {
    const who = character({ height: 1.7 })
    for (const turn of [0, 1, 2, 3]) {
      const partner = { character: who, pose: humanDanceFrame('garba', 2, { turn }).pose, position: [0, 0, 0] as [number, number, number] }
      expect(distance(danceJoint(partner, 'arm.left', 2), danceJoint(partner, 'arm.right', 2))).toBeLessThan(0.06)
    }
  })
  it('bakes tempo-synced JSON without taking over the heading', () => {
    const tracks = humanDanceTracks('dancer', { style: 'garba', bpm: 100, beats: 8, start: 200 })
    const restored = JSON.parse(JSON.stringify(tracks))
    const timeline = new Timeline({ id: 'test', tracks: restored })
    expect(tracks[0].keyframes.at(-1)!.time).toBe(5000)
    expect(tracks.some((track) => track.property === 'turn')).toBe(false)
    expect(timeline.getStateAtTime(800).values.get('dancer')!.get('arm.left.swing')).toBeCloseTo(humanDanceFrame('garba', 1).pose['arm.left.swing'])
  })
  it('rejects malformed custom clips instead of emitting NaN poses', () => {
    expect(() => humanDanceFrame({ ...HUMAN_DANCES.garba, keys: [{ beat: 0, pose: {} }, { beat: 0, pose: {} }] }, 0)).toThrow(/ordered/)
    expect(() => humanDanceFrame({ ...HUMAN_DANCES.garba, strikes: [Infinity] }, 0)).toThrow(/strike/)
    expect(() => humanDanceTracks('dancer', { style: 'garba', start: NaN })).toThrow(/start/)
  })
  it('samples every sparse field across the loop with base, rest and zero defaults', () => {
    const style = JSON.parse(JSON.stringify(sparseDance))
    const base = { 'hand.left.spread': 0.4 }
    const fallback = {
      'hand.left.index.curl': HAND_REST['index.curl'], 'hand.left.spread': 0.4,
      'hand.right.pinky.curl': HAND_REST['pinky.curl'], 'arm.left.elbow': HUMAN_REST['arm.left.elbow'], custom: 0,
    }
    for (const beat of [3, 0, 2, -1, 4, 1, 8, 0.5, 3.5]) {
      const frame = humanDanceFrame(style, beat, base)
      expect(Object.values(frame.pose).every(Number.isFinite)).toBe(true)
      for (const [field, value] of Object.entries(fallback)) {
        expect(Number.isFinite(frame.pose[field]), `${field} @ ${beat}`).toBe(true)
        if ([3, -1, 1].includes(beat)) expect(frame.pose[field]).toBe(value)
      }
      expect(frame.pose).toEqual(humanDanceFrame(style, beat + 4, base).pose)
    }
  })
  for (const circle of [false, true]) {
    it(`round-trips sparse ${circle ? 'circle' : 'pose'} tracks and seeks late-authored hands`, () => {
      const options = { style: sparseDance, pose: { 'hand.left.spread': 0.4 }, bpm: 120, beats: 8, samplesPerBeat: 16, start: 100 }
      const tracks = circle
        ? danceCircleTracks(['stage/a'], { ...options, radius: 1, plantFeet: false })
        : humanDanceTracks('stage/a', options)
      for (const field of ['hand.left.index.curl', 'hand.right.pinky.curl', 'hand.left.spread', 'arm.left.elbow', 'custom']) {
        expect(tracks.some((t) => t.property === field), field).toBe(true)
      }
      expect(tracks.every((t) => t.keyframes.every((k) => typeof k.value === 'number' && Number.isFinite(k.value)))).toBe(true)
      const timeline = new Timeline({ id: 'sparse', tracks: JSON.parse(JSON.stringify(tracks)) })
      for (const beat of [6, 0, 3, 2, 7.5, 1, 4, 0.5, 8, 2]) {
        const values = timeline.getStateAtTime(100 + beat * 500).values.get('stage/a')!
        const direct = humanDanceFrame(sparseDance, beat, options.pose).pose
        for (const field of ['hand.left.index.curl', 'hand.right.pinky.curl', 'hand.left.spread', 'arm.left.elbow', 'custom']) expect(values.get(field)).toBeCloseTo(direct[field], 9)
      }
    })
  }
})

describe('world foot contacts', () => {
  const who = character({ height: 1.7 })
  const rest: DancePartner = { character: who, pose: humanDanceFrame('garba', 0).pose, position: [0, 0, 0] }
  for (const side of ['left', 'right'] as const) {
    for (const point of ['ankle', 'toe'] as const) {
      it(`preserves the current ${side} ${point} with authored hip turn-out`, () => {
        for (const rotate of [-90, -40, 40, 90]) {
          for (const bent of [false, true]) {
            const partner: DancePartner = {
              character: who, position: [0.3, 0.2, -0.4],
              pose: {
                turn: 1.3, roll: 15,
                [`leg.${side}.rotate`]: rotate,
                [`leg.${side}.swing`]: bent ? 22 : 0,
                [`leg.${side}.spread`]: bent ? 7 : 3,
                [`leg.${side}.knee`]: bent ? 48 : 0,
                [`leg.${side}.ankle`]: 5,
              },
            }
            const target = danceJoint(partner, `leg.${side}`, point === 'ankle' ? 2 : 3)
            const result = plantDanceFoot(partner, side, target, point)
            expect(result.reached, `${rotate}, bent ${bent}`).toBe(true)
            expect(result.pose[`leg.${side}.rotate`]).toBe(rotate)
            expect(distance(danceJoint(result, `leg.${side}`, point === 'ankle' ? 2 : 3), target)).toBeLessThan(1e-7)
            expect(distance(result.position, partner.position)).toBeLessThan(1e-7)
          }
        }
      })
    }
  }
  for (const name of Object.keys(HUMAN_DANCES) as HumanDanceName[]) {
    it(`${name}: preserves existing foot contacts with and without hip turn-out`, () => {
      for (let beat = 0; beat < 8; beat += 0.5) {
        for (const side of ['left', 'right'] as const) {
          for (const rotate of [-60, 0, 60]) {
            const partner: DancePartner = {
              character: who, position: [0.2, 0, -0.3],
              pose: humanDanceFrame(name, beat, { turn: 0.7, roll: -10, [`leg.${side}.rotate`]: rotate }).pose,
            }
            for (const point of ['ankle', 'toe'] as const) {
              const joint = point === 'ankle' ? 2 : 3
              const target = danceJoint(partner, `leg.${side}`, joint)
              const result = plantDanceFoot(partner, side, target, point)
              expect(result.reached).toBe(true)
              expect(result.pose[`leg.${side}.rotate`]).toBe(rotate)
              expect(distance(danceJoint(result, `leg.${side}`, joint), target)).toBeLessThan(1e-7)
              expect(distance(result.position, partner.position)).toBeLessThan(1e-7)
            }
          }
        }
      }
    })
  }
  it('keeps a support toe fixed while travelling and turning', () => {
    const target = danceJoint(rest, 'leg.left', 3)
    for (const turn of [0, 0.2, 0.5, 1]) {
      const planted = plantDanceFoot({ ...rest, position: [0.05, 0, 0.05], pose: { ...humanDanceFrame('garba', 0.25).pose, turn } }, 'left', target)
      expect(planted.reached).toBe(true)
      expect(distance(danceJoint(planted, 'leg.left', 3), target)).toBeLessThan(0.0034)
    }
  })
  it('reports unreachable targets without translating the body sideways', () => {
    const result = plantDanceFoot(rest, 'left', [20, 0, 20])
    expect(result.reached).toBe(false)
    expect(result.position[0]).toBe(0)
    expect(result.position[2]).toBe(0)
  })
})

describe('circle choreography', () => {
  it('rejects an explicit count that disagrees with the scene targets', () => {
    expect(() => danceCircleTracks(['stage/a', 'stage/b'], { radius: 1, count: 8, beats: 8 })).toThrow(/count/)
  })
  it('omits unchanged rest-pose fields from a circle bake', () => {
    const tracks = danceCircleTracks(['stage/a', 'stage/b'], { radius: 1, beats: 8 })
    expect(tracks.some((t) => t.property === 'eye.left' || t.property === 'hair.swing')).toBe(false)
    for (const property of ['x', 'y', 'z', 'rotateY']) expect(tracks.some((t) => t.property === property)).toBe(true)
  })
  it('spaces dancers, keeps the radius, and closes position and pose after an orbit', () => {
    const options = { radius: 1.8, count: 8, beatsPerTurn: 32, center: [2, 3] as [number, number] }
    const start = danceCircleAt(0, options)
    const end = danceCircleAt(32, options)
    for (let i = 0; i < 8; i++) {
      expect(distance(start[i].position, end[i].position)).toBeLessThan(1e-9)
      expect(end[i].heading - start[i].heading).toBeCloseTo(360)
      expect(characterJoints(end[i].character, end[i].pose).points['hand.left'].x).toBeCloseTo(characterJoints(start[i].character, start[i].pose).points['hand.left'].x)
      expect(Math.hypot(start[i].position[0] - 2, start[i].position[2] - 3)).toBeCloseTo(1.8)
    }
  })
  it('locks the support toe during a stance and allows independent body spins', () => {
    const options = { radius: 1.8, count: 2, beatsPerTurn: 32 }
    const anchor = danceJoint(danceCircleAt(0, options)[0], 'leg.left', 3)
    for (const beat of [0.1, 0.3, 0.5]) {
      const member = danceCircleAt(beat, options)[0]
      expect(member.planted).toBe(true)
      expect(distance(danceJoint(member, 'leg.left', 3), anchor)).toBeLessThan(0.0034)
    }
    const normal = danceCircleAt(4, { ...options, plantFeet: false })[0]
    const spin = danceCircleAt(4, { ...options, spins: 2, plantFeet: false })[0]
    expect(spin.position).toEqual(normal.position)
    expect(spin.heading - normal.heading).toBeCloseTo(90)
  })
  it('rejects invalid formation parameters', () => {
    expect(() => danceCircleAt(0, { radius: 0 })).toThrow(/positive/)
    expect(() => danceCircleAt(0, { radius: 1, count: 1.5 })).toThrow(/integer/)
    expect(() => danceCircleAt(0, { radius: 1, center: [NaN, 0] })).toThrow(/finite/)
    expect(() => danceCircleAt(0, { radius: 1, spins: Infinity })).toThrow(/finite/)
  })
  it('bakes scene tracks with independent yaw and the same foot contact', () => {
    const options = { radius: 1.8, beatsPerTurn: 32, bpm: 120, beats: 8, start: 100, samplesPerBeat: 20 }
    const tracks = danceCircleTracks(['stage/a', 'stage/b'], options)
    const timeline = new Timeline({ id: 'circle', tracks: JSON.parse(JSON.stringify(tracks)) })
    const values = timeline.getStateAtTime(350).values.get('stage/a')!
    const direct = danceCircleAt(0.5, { ...options, count: 2 })[0]
    expect(values.get('x')).toBeCloseTo(direct.position[0])
    expect(values.get('y')).toBeCloseTo(direct.position[1])
    expect(values.get('rotateY')).toBeCloseTo(direct.heading)
    expect(tracks.some((track) => track.property === 'turn')).toBe(false)
    expect(tracks[0].keyframes.at(-1)!.time).toBe(4100)
  })
  for (const roll of [0, 15, -20]) {
    it(`renders the same world joints, grounding and planted toes with roll ${roll}`, () => {
      const who = character({ height: 1.7 })
      const options = { character: who, radius: 0.8, beatsPerTurn: 64, facing: roll < 0 ? 0 : 90, spins: roll < 0 ? -1 : 1, pose: { roll }, bpm: 120, beats: 8, start: 100, samplesPerBeat: 20 }
      const tracks = danceCircleTracks(['stage/a', 'stage/b'], options)
      const timeline = new Timeline({ id: 'circle', tracks: JSON.parse(JSON.stringify(tracks)) })
      const scene = loadScene3D({
        id: 'stage', camera: 'cam', objects: [
          { id: 'cam', kind: 'camera', projection: 'perspective', fov: 45, near: 0.1, far: 50, position: [0, 2, 6], lookAt: [0, 0.8, 0] },
          { id: 'a', kind: 'character', look: 'solid', height: who.height, rotation: [0, roll ? 35 : 0, 0] },
          { id: 'b', kind: 'character', look: 'solid', height: who.height },
        ],
      }, { kinds: [characterObjects] })
      const anchors = danceCircleAt(0, { ...options, count: 2 }).map((member) => danceJoint(member, 'leg.left', 3))
      for (const beat of [0.5, 2, 7.5, 0, 0.25, 1.25, 0.5]) {
        const frame = resolveScene3D(scene, timeline.getStateAtTime(100 + beat * 500).values, { width: 320, height: 240 })
        const members = danceCircleAt(beat, { ...options, count: 2 })
        members.forEach((member, index) => {
          const centers = frame.meshes.filter((mesh) => mesh.objectId === ['a', 'b'][index]).map((mesh) => mat4.transformPoint(mesh.world, [0, 0, 0]))
          const staged = stagePlanSpace(who.plan, member.pose, { height: who.height, contact: who.contact })
          for (const joints of Object.values(staged.chains)) for (const joint of joints) {
            const world = joint.map((v, axis) => v + member.position[axis])
            expect(Math.min(...centers.map((center) => distance(center, world)))).toBeLessThan(1e-9)
          }
          if (beat <= 0.5) {
            expect(member.planted).toBe(true)
            const toe = danceJoint(member, 'leg.left', 3)
            const renderedToe = centers.reduce((nearest, center) => distance(center, toe) < distance(nearest, toe) ? center : nearest)
            expect(distance(renderedToe, anchors[index])).toBeLessThan(0.0034)
          }
        })
      }
      expect(tracks.some((track) => track.property === 'turn')).toBe(roll !== 0)
      if (roll) expect(tracks.find((track) => track.property === 'rotateY')!.keyframes.every((key) => key.value === 0)).toBe(true)
    })
  }
})

describe('paired dandiya', () => {
  it('both stick tips meet in 3D through a complete turnaround', () => {
    const who = character({ height: 1.7 })
    for (const turn of [0, 0.5, 1, 2, 3, 4]) {
      const a: DancePartner = { character: who, pose: { ...humanDanceFrame('dandiya', 1).pose, turn }, position: [-0.35, 0, 0] }
      const b: DancePartner = { ...a, pose: { ...a.pose, turn: turn + 2 }, position: [0.35, 0, 0] }
      const result = meetDandiya(a, b)
      expect(result.reached, `turn ${turn}`).toBe(true)
      for (const stick of result.sticks) expect(distance(stick.tip, result.point)).toBeLessThan(0.0034)
    }
  })
  it('reports a partner too far away', () => {
    const who = character({ height: 1.7 })
    const a: DancePartner = { character: who, pose: {}, position: [-5, 0, 0] }
    expect(meetDandiya(a, { ...a, position: [5, 0, 0] }).reached).toBe(false)
  })
})
