import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { Timeline } from '../../engine/core/timeline'
import { characterScript, characterStrideLength } from './character-script'
import { character, characterAt, characterPoseOf, characterTarget } from '../character'
import { castMember } from '../cast'
import { HUMAN_REST } from '../species/human'
import { humanGaitStrideLength } from '../species/human-motion'

const H = 170

const run = (beats: Parameters<typeof characterScript>[2], options: Parameters<typeof characterScript>[3] = {}, who = character({ height: H })) => {
  const result = characterScript('amy', who, beats, options)
  const timeline = new Timeline({ id: 's', tracks: result.tracks })
  const target = characterTarget({ x: 0, y: 0, character: who })
  const at = (time: number) => {
    const state = timeline.getStateAtTime(time)
    const values = state.values.get('amy')
    return { ...characterAt(target, { time, state }, 'amy'), x: (values?.get('x') as number) ?? 0, values }
  }
  return { result, at, who }
}

describe('characterScript', () => {
  it('walks to a place, in profile facing right, its walk phase keyed to its own stride', () => {
    const { result, at, who } = run([{ do: 'walk', to: 400 }], { from: 100 })
    expect(at(result.duration + 100).x).toBeCloseTo(300)
    const middle = at(result.duration / 2)
    expect(middle.values?.get('walking')).toBe(1)
    expect(middle.pose.turn).toBeCloseTo(1, 1)
    // The phase covered equals the distance over this character's stride, so the feet stay planted.
    const walk = result.tracks.find((track) => track.property === 'walk')!
    const phase = Number(walk.keyframes[walk.keyframes.length - 1].value) - Number(walk.keyframes[0].value)
    expect(phase).toBeCloseTo(300 / characterStrideLength(who, 'walk'), 5)
    expect(characterStrideLength(who, 'walk')).toBeCloseTo(humanGaitStrideLength('walk', H), 5)
  })

  it('uses a child’s shorter stride', () => {
    const child = character(castMember('boy', H))
    expect(characterStrideLength(child, 'walk')).toBeLessThan(characterStrideLength(character({ height: H }), 'walk'))
    const { result } = run([{ do: 'walk', to: 400 }], { from: 100 }, child)
    const walk = result.tracks.find((track) => track.property === 'walk')!
    expect(Number(walk.keyframes[walk.keyframes.length - 1].value)).toBeCloseTo(300 / characterStrideLength(child, 'walk'), 5)
  })

  it('steps the gait as the target draws, and in characterAt', () => {
    const who = character({ height: H })
    const standing = characterPoseOf({ ...HUMAN_REST, turn: 1 })
    const stepping = characterPoseOf({ ...HUMAN_REST, turn: 1, walk: 0.25, walking: 1, gait: 'walk' })
    expect(stepping['leg.left.swing']).not.toBeCloseTo(standing['leg.left.swing'] ?? 0, 1)
    expect(stepping.turn).toBe(1)
    // Half walking is halfway between.
    const half = characterPoseOf({ ...HUMAN_REST, turn: 1, walk: 0.25, walking: 0.5, gait: 'walk' })
    expect(half['leg.left.swing']).toBeCloseTo((stepping['leg.left.swing'] + (standing['leg.left.swing'] ?? 0)) / 2, 6)
    const { result, at } = run([{ do: 'walk', to: 300 }], {}, who)
    const a = at(result.duration / 2)
    const b = at(result.duration / 2 + 120)
    expect(a.joints.points['ankle.left'].x).not.toBeCloseTo(b.joints.points['ankle.left'].x, 0)
    const canvas = createCanvas(200, 200)
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
    const target = characterTarget({ x: 100, y: 190, character: who })
    expect(() => target.draw(ctx, { ...target, props: { ...target.props, walk: 0.3, walking: 1, gait: 'run' } }, 0)).not.toThrow()
  })

  it('turns round to walk back, facing left with a negative turn', () => {
    const { result, at } = run([{ do: 'walk', to: 300 }, { do: 'walk', to: 0 }])
    const back = result.beats[1]
    const middle = at((back.start + back.end) / 2)
    expect(middle.pose.turn).toBeLessThan(-0.9)
    expect(middle.values?.get('walking')).toBe(1)
    expect(at(result.duration + 50).x).toBeCloseTo(0, 0)
  })

  it('lip-syncs a line over the mouth, and keeps the lines and beats', () => {
    const { result, at } = run([{ do: 'say', say: 'Is that box ticking?', mood: 'worried' }])
    expect(result.lines).toHaveLength(1)
    const line = result.lines[0]
    expect(result.tracks.some((track) => track.property === 'mouth')).toBe(true)
    const open = Array.from({ length: 12 }, (_, i) => at(line.start + ((line.end - line.start) * (i + 1)) / 13).pose.mouth)
    expect(Math.max(...open)).toBeGreaterThan(0.3)
    expect(result.beats).toHaveLength(1)
    expect(result.duration).toBe(result.beats[0].end)
  })

  it('strikes poses and plays gags on the human body', () => {
    const { result, at } = run([{ do: 'wave', for: 600 }, { do: 'take' }])
    const waving = at(result.beats[0].end - 50).pose
    expect(Math.max(waving['arm.left.spread'], waving['arm.right.spread'])).toBeGreaterThan(60)
    const stretch = result.tracks.find((track) => track.property === 'stretch')!
    expect(stretch.keyframes.some((key) => Math.abs(Number(key.value) - 1) > 0.05)).toBe(true)
    expect(result.keys.every((key) => typeof key.pose === 'object')).toBe(true)
  })

  it('accepts the cast’s own gaits, and is the same every time', () => {
    const gaits = { hop: { swing: 30, knee: 60, arm: 10, elbow: 0, lean: 0, cycle: 600 } }
    const beats = [{ do: 'hop', to: 250 }]
    const a = characterScript('amy', character({ height: H }), beats, { gaits })
    const b = characterScript('amy', character({ height: H }), beats, { gaits })
    expect(a.tracks).toEqual(b.tracks)
    expect(a.tracks.find((track) => track.property === 'gait')!.keyframes.some((key) => key.value === 'hop')).toBe(true)
    const who = character({ height: H })
    const target = characterTarget({ x: 0, y: 0, character: who, gaits })
    const pose = characterPoseOf({ ...HUMAN_REST, walk: 0.25, walking: 1, gait: 'hop' }, HUMAN_REST, target.gaits)
    expect(pose['leg.left.knee']).toBeGreaterThan(0)
  })

  it('zips off with dust, and leaves hair tracks to hairFollowTracks', () => {
    const { result } = run([{ do: 'zip', to: -200 }])
    expect(result.effects.some((effect) => effect.kind === 'dust')).toBe(true)
    expect(result.tracks.some((track) => track.property.startsWith('hair.'))).toBe(false)
  })
})
