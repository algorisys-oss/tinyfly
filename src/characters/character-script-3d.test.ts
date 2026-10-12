import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { Timeline } from '../engine/core/timeline'
import { loadScene3D, drawScene3D, type Scene3D } from '../scene-3d'
import { characterScript3D, checkCharacterBeats3D, type CharacterBeat3D } from './character-script-3d'
import { characterObjects } from './scene-objects'
import { humanGaitStrideLength } from './species/human-motion'
import { HUMAN_POSES, HUMAN_REST } from './species/human'
import { HAND_REST } from './hands/hand-rig'
import { humanDanceFrame, type HumanDanceName } from './human-dance'

const stateOf = (result: ReturnType<typeof characterScript3D>, target: string) => {
  const timeline = new Timeline({ id: 't', tracks: result.tracks })
  return (time: number) => Object.fromEntries(timeline.getStateAtTime(time).values.get(target) ?? []) as Record<string, number | string>
}

describe('characterScript3D', () => {
  it.each<CharacterBeat3D>([
    { do: 'spin', turns: -1, for: 1200 },
    { do: 'face', toward: 180, for: 1200 },
    { do: 'face', toward: 90, for: 1200 },
    { do: 'walk', to: [0, 2], for: 1200 },
    { do: 'place', to: [1, 0], toward: 180 },
  ])('preserves an eased face before an immediate $do action', (next) => {
    const face: CharacterBeat3D = { do: 'face', toward: 90, for: 900 }
    const options = { scene: 's' }
    const alone = stateOf(characterScript3D('tum', [face], options), 's/tum')
    const result = characterScript3D('tum', [face, next], options)
    const composed = stateOf({ ...result, tracks: JSON.parse(JSON.stringify(result.tracks)) }, 's/tum')
    for (const time of [720, 90, 315, 810, 180, 900]) expect(composed(time).rotateY).toBeCloseTo(alone(time).rotateY as number, 10)
    const following = stateOf(characterScript3D('tum', [{ ...next, at: 900 }], { ...options, heading: 90 }), 's/tum')
    for (const time of [960, 1170, 1860, 1440]) expect(composed(time).rotateY).toBeCloseTo(following(time).rotateY as number, 10)
  })

  it.each<CharacterBeat3D>([
    { do: 'dance', dance: 'garba', beats: 8 },
    { do: 'pose', pose: 'cheer', for: 700 },
  ])('preserves an eased pose before an immediate $do action', (next) => {
    const pose: CharacterBeat3D = { do: 'pose', pose: 'wave', for: 800 }
    const options = { scene: 's' }
    const first = characterScript3D('tum', [pose], options)
    const alone = stateOf(first, 's/tum')
    const result = characterScript3D('tum', [pose, next], options)
    const composed = stateOf({ ...result, tracks: JSON.parse(JSON.stringify(result.tracks)) }, 's/tum')
    for (const time of [640, 80, 280, 720, 160, 800]) {
      for (const field of Object.keys(HUMAN_POSES.wave)) expect(composed(time)[field] ?? HUMAN_REST[field]).toBeCloseTo((alone(time)[field] ?? HUMAN_REST[field]) as number, 10)
    }
    const following = stateOf(characterScript3D('tum', [{ ...next, at: 800 }], { ...options, pose: first.end.pose }), 's/tum')
    for (const time of [825, 940, 1110, 1600]) {
      for (const field of Object.keys(HUMAN_POSES.wave)) expect(composed(time)[field] ?? first.end.pose[field]).toBeCloseTo((following(time)[field] ?? first.end.pose[field]) as number, 10)
    }
  })

  it('preserves the eased stop before an immediate walk', () => {
    const walk: CharacterBeat3D = { do: 'walk', to: [0, 2], for: 1000 }
    const options = { scene: 's' }
    const alone = stateOf(characterScript3D('tum', [walk], options), 's/tum')
    const composed = stateOf(characterScript3D('tum', [walk, { do: 'walk', to: [0, 4], for: 1000 }], options), 's/tum')
    for (const time of [750, 850, 925, 990]) expect(composed(time).walking).toBeCloseTo(alone(time).walking as number, 10)
  })

  it('spins full signed revolutions from its current heading, with the requested duration', () => {
    const result = characterScript3D('tum', [{ do: 'spin', turns: 2, for: 1200 }, { do: 'spin', turns: -1, for: 600 }], { scene: 's', heading: 30 })
    const state = stateOf(result, 's/tum')
    expect(state(600).rotateY).toBeCloseTo(390)
    expect(state(1200).rotateY).toBeCloseTo(750)
    expect(state(1500).rotateY).toBeCloseTo(570)
    expect(result.duration).toBe(1800)
    expect(result.end.heading).toBe(390)
  })

  it('face still chooses the shortest turn and honors an explicit duration', () => {
    const result = characterScript3D('tum', [{ do: 'face', toward: 10, for: 900 }], { scene: 's', heading: 350 })
    expect(result.duration).toBe(900)
    expect(result.end.heading).toBe(370)
    expect(characterScript3D('tum', [{ do: 'face', toward: 360 }], { scene: 's' }).duration).toBe(0)
  })

  it('native dances key limbs without resetting world or pose headings', () => {
    const result = characterScript3D('tum', [{ do: 'dance', dance: 'garba', bpm: 120, beats: 8 }, { do: 'spin', turns: 1, for: 1000 }], { scene: 's', heading: 180, pose: { turn: 0.5 } })
    const state = stateOf(result, 's/tum')
    expect(result.beats[0].end).toBe(4000)
    expect(state(2000).rotateY).toBe(180)
    expect(result.end.pose.turn).toBe(0.5)
    expect(result.tracks.some((track) => track.property === 'turn')).toBe(false)
    expect(result.end.heading).toBe(540)
  })

  it('keeps the preceding pose held until a dance actually begins', () => {
    const result = characterScript3D('tum', [{ do: 'pose', pose: 'wave', for: 500 }, { do: 'hold', for: 3000 }, { do: 'dance', dance: 'garba', beats: 8 }], { scene: 's' })
    const state = stateOf(result, 's/tum')
    for (const time of [500, 2000, 3499, 3500]) expect(state(time)['arm.right.spread']).toBeCloseTo(HUMAN_POSES.wave['arm.right.spread'])
    expect(state(4000)['arm.right.spread']).not.toBeCloseTo(HUMAN_POSES.wave['arm.right.spread'])
    expect(result.duration).toBe(7500)
  })

  it.each<HumanDanceName>(['garba', 'dandiya'])('preserves held hands and blends from their resolved pose into %s', (dance) => {
    const poses: Record<string, number>[] = [{}, { 'hand.left.index.curl': 0, 'hand.right.spread': 0, 'hand.right.thumb.curl': 0.7 }]
    for (const pose of poses) {
      const result = characterScript3D('tum', [{ do: 'hold', for: 1000 }, { do: 'dance', dance, bpm: 120, beats: 8 }], { scene: 's', pose })
      const state = stateOf({ ...result, tracks: JSON.parse(JSON.stringify(result.tracks)) }, 's/tum')
      for (const side of ['left', 'right']) {
        for (const [field, rest] of Object.entries(HAND_REST)) {
          const property = `hand.${side}.${field}`
          const from = pose[property] ?? rest
          for (const time of [999, 0, 500, 1000, 125]) expect(state(time)[property] ?? from).toBeCloseTo(from, 10)
          const track = result.tracks.find((track) => track.property === property)
          if (!track) continue
          expect(track.keyframes[0]).toMatchObject({ time: 1000, value: from })
          const first = track.keyframes[1]
          const t = (first.time - 1000) / 150
          const weight = t * t * (3 - 2 * t)
          const frame = humanDanceFrame(dance, (first.time - 1000) * 120 / 60000, { ...HUMAN_REST, ...pose }).pose
          expect(state(first.time)[property]).toBeCloseTo(from + (frame[property] - from) * weight, 10)
        }
      }
    }
  })

  it.each<HumanDanceName>(['garba', 'dandiya'])('renders the preceding hold unchanged before %s', (dance) => {
    const scene: Scene3D = {
      id: 's', camera: 'cam', background: '#ffffff',
      objects: [
        { id: 'cam', kind: 'camera', projection: 'perspective', fov: 40, near: 0.1, far: 50, position: [0, 1, 4], lookAt: [0, 0.9, 0] },
        { id: 'tum', kind: 'character', character: { hands: 'cartoon', handStyle: 'natural' } },
      ],
    }
    const draw = (values: Record<string, number | string>) => {
      const ctx = createCanvas(320, 360).getContext('2d') as unknown as CanvasRenderingContext2D
      drawScene3D(ctx, loadScene3D(scene, { kinds: [characterObjects] }), new Map([['s/tum', new Map(Object.entries(values))]]), { width: 320, height: 360 })
      return ctx.getImageData(0, 0, 320, 360).data
    }
    const poses: Record<string, number>[] = [{}, { 'hand.left.index.curl': 0, 'hand.right.spread': 0 }]
    for (const pose of poses) {
      scene.objects[1] = { id: 'tum', kind: 'character', character: { hands: 'cartoon', handStyle: 'natural' }, pose }
      const hold: CharacterBeat3D = { do: 'hold', for: 1000 }
      const options = { scene: 's', pose }
      const alone = stateOf(characterScript3D('tum', [hold], options), 's/tum')
      const result = characterScript3D('tum', [hold, { do: 'dance', dance, bpm: 120, beats: 8 }], options)
      const composed = stateOf({ ...result, tracks: JSON.parse(JSON.stringify(result.tracks)) }, 's/tum')
      for (const time of [999, 0, 500, 1000, 125]) {
        const before = draw(alone(time))
        const after = draw(composed(time))
        expect(after.some((value, i) => value !== before[i])).toBe(false)
      }
      const held = draw(alone(1000))
      expect(draw(composed(1250)).some((value, i) => value !== held[i])).toBe(true)
    }
  })

  it('starts hand pose transitions at rest and preserves them through dance entry', () => {
    const pose: CharacterBeat3D = { do: 'pose', pose: { 'hand.left.index.curl': 0, 'hand.right.spread': 0.8 }, for: 800 }
    const first = characterScript3D('tum', [pose], { scene: 's' })
    const result = characterScript3D('tum', [pose, { do: 'hold', for: 1000 }, { do: 'dance', dance: 'garba', bpm: 120 }], { scene: 's' })
    const alone = stateOf(first, 's/tum')
    const composed = stateOf(result, 's/tum')
    expect(alone(0)['hand.left.index.curl']).toBe(HAND_REST['index.curl'])
    expect(alone(0)['hand.right.spread']).toBe(HAND_REST.spread)
    for (const time of [720, 0, 315, 80, 800, 1799, 1800]) {
      for (const field of Object.keys(pose.pose!)) expect(composed(time)[field]).toBeCloseTo(alone(time)[field] as number, 10)
    }
  })

  it('uses an explicit face duration even when no turn is needed', () => {
    const result = characterScript3D('tum', [{ do: 'face', toward: 360, for: 900 }, { do: 'spin', turns: 1, for: 1000 }], { scene: 's' })
    expect(result.beats[1].start).toBe(900)
    expect(stateOf(result, 's/tum')(899).rotateY).toBe(0)
    expect(result.duration).toBe(1900)
  })

  it('rejects invalid spin/dance inputs before producing tracks', () => {
    expect(checkCharacterBeats3D([{ do: 'spin', turns: NaN }])[0].message).toMatch(/turns/)
    expect(checkCharacterBeats3D([{ do: 'spin', for: 0 }])[0].message).toMatch(/for/)
    expect(checkCharacterBeats3D([{ do: 'dance', dance: 'garba', bpm: -1 }])[0].message).toMatch(/bpm/)
    expect(checkCharacterBeats3D([{ do: 'dance', dance: 'unknown' }])[0].message).toMatch(/native dance/)
    expect(checkCharacterBeats3D([{ do: 'face', toward: Infinity }])[0].message).toMatch(/finite/)
  })

  it('walks to a point with its gait in step with the distance, so its feet stay planted', () => {
    const result = characterScript3D('tum', [{ do: 'walk', to: [4, 3] }], { scene: 's', position: [0, 0], heading: 53.13 })
    const state = stateOf(result, 's/tum')
    const stride = humanGaitStrideLength('walk', 1.7)
    for (let time = 0; time <= result.duration; time += 61) {
      const now = state(time)
      expect((now.walk as number) * stride).toBeCloseTo(Math.hypot(now.x as number, now.z as number), 6)
    }
    const end = state(result.duration)
    expect(end.x).toBeCloseTo(4)
    expect(end.z).toBeCloseTo(3)
    expect(end.walking).toBeCloseTo(0)
    expect(state(result.duration / 2).walking).toBeCloseTo(1)
    expect(state(result.duration / 2).gait).toBe('walk')
    // At a walk's pace: 5 m in about 5 / 1.3 s.
    expect(result.duration).toBeCloseTo((5 / 1.3) * 1000, -2)
  })

  it('runs faster than it walks, and a taller character covers more ground per stride', () => {
    const walk = characterScript3D('a', [{ do: 'walk', to: [0, 10] }], { scene: 's' })
    const run = characterScript3D('a', [{ do: 'run', to: [0, 10] }], { scene: 's' })
    expect(run.duration).toBeLessThan(walk.duration / 2)
    expect(humanGaitStrideLength('walk', 2)).toBeGreaterThan(humanGaitStrideLength('walk', 1.7))
  })

  it('poses, plays gags and faces things, keying only what changes', () => {
    const result = characterScript3D('tum', [{ do: 'pose', pose: 'wave' }, { do: 'face', toward: [-1, 0] }, { do: 'gag', gag: 'take' }], { scene: 's', heading: 0 })
    const state = stateOf(result, 's/tum')
    expect(state(result.beats[0].end)['arm.right.spread']).toBeCloseTo(HUMAN_POSES.wave['arm.right.spread'])
    expect(state(result.beats[1].end).rotateY).toBeCloseTo(-90)
    expect(result.beats[2].end).toBeGreaterThan(result.beats[2].start + 500)
    expect(result.tracks.find((t) => t.property === 'arm.left.knee')).toBeUndefined()
  })

  it('the character object steps its legs from walk and walking, on the pose it holds', () => {
    const scene: Scene3D = {
      id: 's',
      camera: 'cam',
      background: '#ffffff',
      objects: [
        { id: 'cam', kind: 'camera', projection: 'perspective', fov: 40, near: 0.1, far: 50, position: [5, 1, 0], lookAt: [0, 0.9, 0] },
        { id: 'tum', kind: 'character' },
      ],
    }
    const draw = (values: Record<string, number | string>) => {
      const ctx = createCanvas(160, 120).getContext('2d') as unknown as CanvasRenderingContext2D
      drawScene3D(ctx, loadScene3D(scene, { kinds: [characterObjects] }), new Map([['s/tum', new Map(Object.entries(values))]]), { width: 160, height: 120 })
      return ctx.getImageData(0, 0, 160, 120).data
    }
    const differ = (a: Uint8ClampedArray, b: Uint8ClampedArray) => a.some((v, i) => v !== b[i])
    const still = draw({})
    expect(differ(still, draw({ walk: 0.25, walking: 0 }))).toBe(false)
    expect(differ(still, draw({ walk: 0.25, walking: 1 }))).toBe(true)
    expect(differ(draw({ walk: 0.25, walking: 1 }), draw({ walk: 0.25, walking: 1, gait: 'run' }))).toBe(true)
  })

  it('checks its beats, naming what was probably meant', () => {
    expect(checkCharacterBeats3D([{ do: 'wlak', to: [1, 1] }])[0].message).toMatch(/did you mean "walk"/)
    expect(checkCharacterBeats3D([{ do: 'wave' }])[0].message).toMatch(/did you mean "pose"/)
    expect(checkCharacterBeats3D([{ do: 'take' }])[0].message).toMatch(/did you mean "gag"/)
    expect(checkCharacterBeats3D([{ do: 'turn', toward: 90 }])[0].message).toMatch(/did you mean "face"/)
    expect(checkCharacterBeats3D([{ do: 'pose', pose: 'wav' }])[0].message).toMatch(/did you mean "wave"/)
    expect(checkCharacterBeats3D([{ do: 'run', to: 3 }])[0].message).toMatch(/\[x, z\] metres/)
    expect(() => characterScript3D('t', [{ do: 'wlak', to: [1, 1] }], { scene: 's' })).toThrow(/beat 0/)
  })
})
