import { describe, it, expect } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { scriptTracks, speechDuration, GAIT_CYCLE_MS } from './script'
import { gagDuration } from './gags'
import { gaitStrideLength } from '../gaits'
import { stickFigureAt, stickFigureTarget } from '../stick-figure'

const H = 170
const run = (beats: Parameters<typeof scriptTracks>[1], options: Parameters<typeof scriptTracks>[2] = {}) => {
  const result = scriptTracks('hero', beats, { height: H, ...options })
  const timeline = new Timeline({ id: 's', tracks: result.tracks })
  const target = stickFigureTarget({ x: 0, y: 0, style: { height: H } })
  const at = (time: number) => {
    const state = timeline.getStateAtTime(time)
    const values = state.values.get('hero')
    return { ...stickFigureAt(target, { time, state }, 'hero'), x: (values?.get('x') as number) ?? 0, values }
  }
  return { result, at }
}

describe('scriptTracks', () => {
  it('walks to a place, at the gait’s pace, feet planted', () => {
    const { result, at } = run([{ do: 'walk', to: 400 }], { from: 100 })
    const distance = 300
    const cycles = distance / gaitStrideLength('walk', H)
    expect(result.duration).toBeCloseTo(220 + cycles * GAIT_CYCLE_MS.walk, 0)
    expect(at(result.duration + 100).x).toBeCloseTo(300)
    // Mid-walk it is walking, in profile, facing right.
    const middle = at(result.duration / 2)
    expect(middle.values?.get('walking')).toBe(1)
    expect(middle.pose.turn).toBeCloseTo(1, 1)
  })

  it('turns round to walk the other way, and picks the gait', () => {
    const { result, at } = run([
      { do: 'walk', to: 300 },
      { do: 'sneak', to: 0 },
    ])
    const sneaking = result.beats[1]
    const mid = at((sneaking.start + sneaking.end) / 2)
    expect(mid.values?.get('gait')).toBe('sneak')
    expect(mid.values?.get('facing')).toBe(-1)
    expect(at(sneaking.end + 200).x).toBeCloseTo(0)
  })

  it('poses, gags and holds take their lengths, one after another', () => {
    const { result } = run([
      { do: 'wave', for: 900 },
      { do: 'take' },
      { do: 'hold', for: 500 },
    ])
    expect(result.beats.map((b) => b.end - b.start)).toEqual([900, gagDuration('take'), 500])
    expect(result.duration).toBe(900 + gagDuration('take') + 500)
  })

  it('lip-syncs what is said, for as long as it takes to say', () => {
    const { result, at } = run([{ do: 'say', say: 'Where did my pot go?', mood: 'confused' }])
    expect(result.duration).toBe(speechDuration('Where did my pot go?'))
    expect(result.lines).toHaveLength(1)
    const line = result.lines[0]
    let open = 0
    for (let t = line.start; t <= line.end; t += 20) open = Math.max(open, at(t).pose.mouth)
    expect(open).toBeGreaterThan(0.4)
    // Mouth keys stay in order after merging with the acted face.
    const mouth = result.tracks.find((t) => t.property === 'mouth')!
    const times = mouth.keyframes.map((k) => k.time)
    expect([...times].sort((a, b) => a - b)).toEqual(times)
  })

  it('looks and faces toward a place', () => {
    const { at, result } = run([
      { do: 'look', toward: 'viewer' },
      { do: 'face', toward: -200 },
    ], { from: 0 })
    expect(at(result.beats[0].end).pose.turn).toBeCloseTo(0, 1)
    expect(at(result.duration + 300).values?.get('facing')).toBe(-1)
  })

  it('starts beats at `at` when given, and every track stays in time order', () => {
    const { result } = run([
      { do: 'walk', to: 200, mood: 'happy' },
      { do: 'surprised', at: 5000, mood: 'shocked' },
      { do: 'run', to: -100, say: 'Aaah!' },
      { do: 'cheer' },
    ])
    expect(result.beats[1].start).toBe(5000)
    for (const track of result.tracks) {
      const times = track.keyframes.map((k) => k.time)
      expect([...times].sort((a, b) => a - b), track.property).toEqual(times)
    }
    expect(JSON.parse(JSON.stringify(result.tracks))).toEqual(result.tracks)
  })
})
