import { describe, it, expect } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { defineAction, defineGait, expandBeats } from './custom'
import { persona } from './persona'
import { scriptTracks } from './script'
import { checkBeats } from './beat-check'
import { describeTarget } from '../../adapters/canvas/target-properties'
import { stickFigureAt } from '../stick-figure'
import { EXPRESSIONS, POSES } from '../stick-figure'

const facepalm = defineAction({
  summary: 'Drops its face into its hand.',
  steps: (from) => [
    { after: 250, pose: { rightShoulder: 150, rightElbow: 150, headTilt: from.headTilt - 12 } },
    { after: 900, pose: { headTilt: from.headTilt - 16 } },
  ],
})
const nervousPoint = defineAction({
  summary: 'Trembles, then points at the target.',
  needs: ['target'],
  beats: (beat) => [{ do: 'tremble' }, { do: 'point', target: beat.target }],
})
const limp = defineGait({ swing: 14, knee: 10, arm: 10, elbow: 6, lean: 6, cycle: 1400, summary: 'A limp' })

describe('custom actions and gaits', () => {
  it('splices a steps action in like a gag, built on the current pose', () => {
    const result = scriptTracks('hero', [{ do: 'wave' }, { do: 'facepalm' }], { actions: { facepalm } })
    const span = result.beats[1]
    expect(span.end - span.start).toBe(900)
    const last = result.keys.filter((key) => key.time <= span.end).at(-1)!.pose as typeof POSES.wave
    expect(last.rightShoulder).toBe(150)
    expect(last.headTilt).toBe(POSES.wave.headTilt - 16)
  })

  it('expands a beats action into the beats it builds, passing on at, mood and say', () => {
    const target = { x: 300, y: -100 }
    expect(expandBeats([{ do: 'nervousPoint', target, at: 500, mood: 'scared' }], { nervousPoint })).toEqual([
      { do: 'tremble', at: 500, mood: 'scared' },
      { do: 'point', target },
    ])
    const result = scriptTracks('hero', [{ do: 'nervousPoint', target }], { actions: { nervousPoint }, height: 100 })
    expect(result.beats).toHaveLength(2)
    expect(result.beats[1].contact).toBeDefined()
  })

  it('walks in a gait of its own, at its own pace, and the figure draws it', () => {
    const result = scriptTracks('hero', [{ do: 'limp', to: 400 }], { gaits: { limp }, height: 100 })
    expect(result.tracks.find((t) => t.property === 'gait')!.keyframes.at(-1)!.value).toBe('limp')
    const walk = scriptTracks('hero', [{ do: 'walk', to: 400 }], { height: 100 })
    expect(result.duration).toBeGreaterThan(walk.duration)
    const actor = persona({ name: 'Limper', gaits: { limp } })
    const figure = actor.figure({ x: 0, y: 0 })
    const timeline = new Timeline({ id: 't', tracks: result.tracks })
    const mid = result.duration / 2
    const { pose } = stickFigureAt(figure, { time: mid, state: timeline.getStateAtTime(mid) }, 'hero')
    expect(Math.abs(pose.leftHip)).toBeLessThanOrEqual(14.01)
  })

  it('checks custom names, the fields they need, and refuses names that shadow built-ins', () => {
    expect(checkBeats([{ do: 'facepalm' }], { actions: { facepalm } })).toEqual([])
    expect(checkBeats([{ do: 'facepalm' }])[0].message).toMatch(/Unknown action "facepalm"/)
    expect(checkBeats([{ do: 'nervousPoint' }], { actions: { nervousPoint } })[0].message).toMatch(/`nervousPoint` needs `target`/)
    expect(checkBeats([], { actions: { wave: facepalm } })[0].message).toMatch(/"wave" has the name of a built-in/)
    const broken = defineAction({ summary: 'Broken', beats: () => [{ do: 'hopp' }] })
    expect(() => scriptTracks('hero', [{ do: 'broken' }], { actions: { broken } })).toThrow(/after expanding custom actions[\s\S]*"hopp"/)
    const loop: ReturnType<typeof defineAction> = defineAction({ summary: 'Loops', beats: () => [{ do: 'loop' }] })
    expect(() => scriptTracks('hero', [{ do: 'loop' }], { actions: { loop } })).toThrow(/nest more than/)
  })

  it('rejects malformed definitions', () => {
    expect(() => defineAction({ summary: 'x' } as never)).toThrow(/either `steps/)
    expect(() => defineGait({ swing: 'a' } as never)).toThrow(/`swing` must be a number/)
  })
})

describe('persona', () => {
  const junior = persona({
    name: 'Junior',
    summary: 'A nervous junior developer',
    look: { color: '#2563eb' },
    acting: 'full',
    gait: 'sneak',
    mood: 'worried',
    stance: 'handsOnHips',
    actions: { facepalm, nervousPoint },
    gaits: { limp },
  })

  it('makes figures that look like it, in its usual stance and face', () => {
    const figure = junior.figure({ x: 100, y: 300 })
    expect(figure.figureStyle).toMatchObject({ color: '#2563eb', height: 120 })
    expect(figure.props?.leftBrow).toBe(EXPRESSIONS.worried.leftBrow)
    expect(figure.props?.leftElbow).toBe(POSES.handsOnHips.leftElbow)
  })

  it('scripts the way it acts: go in its gait, stand back to its stance', () => {
    const result = junior.script('hero', [{ do: 'go', to: 400 }, { do: 'wave' }, { do: 'stand' }], { from: 100, ground: 300 })
    expect(result.tracks.find((t) => t.property === 'gait')!.keyframes.map((k) => k.value)).toContain('sneak')
    expect(result.keys.at(-1)!.pose).toMatchObject({ leftElbow: POSES.handsOnHips.leftElbow, leftBrow: EXPRESSIONS.worried.leftBrow })
  })

  it('says who it is and what it can do, and its figures do too', () => {
    const description = junior.describe()
    expect(description.habits).toEqual({ height: 120, acting: 'full', gait: 'sneak', mood: 'worried', stance: 'handsOnHips' })
    expect(description.own).toEqual({ actions: ['facepalm', 'nervousPoint'], gaits: ['limp'] })
    expect(description.actions.facepalm).toBe('Drops its face into its hand.')
    expect(describeTarget(junior.figure({ x: 0, y: 0 })).actions?.limp).toBe('A limp')
    expect(junior.check([{ do: 'facepalm', mood: 'sadd' }])[0].message).toMatch(/did you mean "sad"/)
  })

  it('refuses unknown habits with suggestions', () => {
    expect(() => persona({ name: 'X', gait: 'strutt' })).toThrow(/did you mean "strut"/)
    expect(() => persona({ name: 'X', mood: 'smugg' as never })).toThrow(/did you mean "smug"/)
    expect(() => persona({ name: 'X', acting: 'snapy' as never })).toThrow(/did you mean "snappy"/)
  })
})
