import { describe, it, expect } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { scriptTracks, speechDuration, GAIT_CYCLE_MS } from './script'
import { gagDuration } from './gags'
import { gaitStrideLength } from '../gaits'
import { stickFigureAt, stickFigureTarget } from '../stick-figure'
import { handPath } from './hand-path'

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

  it('zips off: winds up, wheels its legs in place, then shoots to the place, leaving dust', () => {
    const { result, at } = run([{ do: 'zip', to: 900 }], { from: 100 })
    const dust = result.effects.find((e) => e.kind === 'dust')!
    expect(dust.x).toBe(100)
    // Wheeling in place: running legs, but not moving yet.
    const wheeling = at(dust.time - 100)
    expect(wheeling.values?.get('gait')).toBe('run')
    expect(wheeling.values?.get('walking')).toBe(1)
    expect(wheeling.x).toBeCloseTo(0)
    // Then it is off, and gets there fast.
    expect(at(result.duration).x).toBeCloseTo(800)
    expect(result.duration - dust.time).toBeLessThan(500)
  })

  it('asks for dust where a take lands', () => {
    const { result } = run([{ do: 'walk', to: 300 }, { do: 'take' }], { from: 0 })
    expect(result.effects).toEqual([{ kind: 'dust', time: result.beats[1].start + 900, x: 300, y: 0, length: 500 }])
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

describe('scriptTracks: acting on things', () => {
  it('leaps onto a higher floor: arcs above it and lands at contact', () => {
    const { result } = run([{ do: 'leap', to: 300, onto: -80 }], { from: 100, ground: 0 })
    const span = result.beats[0]
    const timeline = new Timeline({ id: 's', tracks: result.tracks })
    const y = (time: number) => timeline.getStateAtTime(time).values.get('hero')?.get('y') as number
    const x = (time: number) => timeline.getStateAtTime(time).values.get('hero')?.get('x') as number
    expect(span.contact).toBeGreaterThan(span.start)
    expect(y(span.contact!)).toBeCloseTo(-80)
    expect(x(span.contact!)).toBeCloseTo(200)
    // Mid-flight it is above both floors.
    const ys = Array.from({ length: 40 }, (_, i) => y(span.start + ((span.contact! - span.start) * i) / 40))
    expect(Math.min(...ys)).toBeLessThan(-80 - 0.3 * H)
    expect(result.effects.at(-1)).toMatchObject({ kind: 'dust', x: 300, y: -80, time: span.contact })
  })

  it('points a straight arm at a target', () => {
    const target = { x: 400, y: -200 }
    const { result, at } = run([{ do: 'point', target }], { from: 100 })
    const { joints } = at(result.beats[0].contact! + 200)
    const shoulder = joints.shoulders.right
    const hand = joints.hands.right
    const aimed = Math.atan2(hand.y - shoulder.y, hand.x - shoulder.x)
    const wanted = Math.atan2(target.y - shoulder.y, target.x - (shoulder.x + 100))
    expect(Math.abs(aimed - wanted)).toBeLessThan(0.12)
  })

  it('turns round to point at something behind it', () => {
    const { result, at } = run([{ do: 'point', target: { x: -300, y: -120 } }], { from: 0 })
    expect(at(result.beats[0].contact! + 100).values?.get('facing')).toBe(-1)
  })

  it('swipes across a target from the near edge to the far edge', () => {
    const box = { x: 200, y: -100, left: 150, right: 250 }
    const { result, at } = run([{ do: 'swipe', target: box }], { from: 0 })
    const span = result.beats[0]
    expect(span.release! - span.contact!).toBeGreaterThan(0)
    const handX = (time: number) => at(time).joints.hands.right.x
    // The hand is at the near edge on contact, and crosses to the far edge.
    expect(Math.abs(handX(span.contact!) - 150)).toBeLessThan(12)
    expect(Math.abs(handX(span.release!) - 250)).toBeLessThan(12)
    expect(span.end).toBeGreaterThan(span.release!)
  })

  it('is carried to a new floor with `onto`', () => {
    const { result } = run([{ do: 'hold', for: 400, onto: -24 }], { ground: 0 })
    const timeline = new Timeline({ id: 's', tracks: result.tracks })
    expect(timeline.getStateAtTime(400).values.get('hero')?.get('y')).toBeCloseTo(-24)
  })

  it('ducks and lies down as named poses', () => {
    const { result, at } = run([{ do: 'duck', for: 600 }, { do: 'lie', for: 900 }])
    expect(at(result.beats[0].end - 50).pose.stretch).toBeLessThan(0.8)
    expect(at(result.beats[1].end).pose.spin).toBeCloseTo(-90, 0)
  })
})

describe('scriptTracks: grab, throw, kick', () => {
  it('reaches its hand to what it grabs, then lifts it overhead', () => {
    const target = { x: 200, y: -70 }
    const { result } = run([{ do: 'grab', target }], { from: 0 })
    const span = result.beats[0]
    const path = handPath('hero', result.tracks, { x: 0, y: 0, style: { height: H }, start: span.contact!, end: span.end })
    expect(Math.hypot(path[0].x - target.x, path[0].y - target.y)).toBeLessThan(0.08 * H)
    // Lifted: the hand ends above the head.
    expect(path.at(-1)!.y).toBeLessThan(-H)
  })

  it('bends down to grab something low', () => {
    const target = { x: 60, y: -30 }
    const { result } = run([{ do: 'grab', target }], { from: 0 })
    const contact = result.beats[0].contact!
    const [hand] = handPath('hero', result.tracks, { x: 0, y: 0, style: { height: H }, start: contact, end: contact })
    expect(Math.hypot(hand.x - target.x, hand.y - target.y)).toBeLessThan(0.12 * H)
  })

  it('throws: the hand moves forward and up as it lets go', () => {
    const { result } = run([{ do: 'throw', to: 500 }], { from: 0 })
    const release = result.beats[0].release!
    const path = handPath('hero', result.tracks, { x: 0, y: 0, style: { height: H }, start: release - 66, end: release })
    expect(path.at(-1)!.x).toBeGreaterThan(path[0].x)
  })

  it('kicks: the foot meets the target at contact', () => {
    const target = { x: 300, y: -20 }
    const { result, at } = run([{ do: 'kick', target }], { from: 0 })
    const { joints } = at(result.beats[0].contact!)
    const foot = joints.feet.right
    expect(Math.abs(foot.x - target.x)).toBeLessThan(0.15 * H)
    expect(foot.y).toBeLessThan(-0.05 * H)
  })
})

describe('scriptTracks: put, write, push', () => {
  const palm = (result: ReturnType<typeof scriptTracks>, time: number) =>
    handPath('hero', result.tracks, { x: 0, y: 0, style: { height: H }, start: time, end: time })[0]

  it('puts its hand on the spot', () => {
    const target = { x: 200, y: -60 }
    const { result } = run([{ do: 'put', target }], { from: 0 })
    const hand = palm(result, result.beats[0].contact!)
    expect(Math.hypot(hand.x - target.x, hand.y - target.y)).toBeLessThan(1)
  })

  it('writes along a spot left to right, shuffling along when it is wider than the arm reaches', () => {
    for (const [left, right] of [[200, 260], [200, 420]]) {
      const target = { x: (left + right) / 2, y: -150, left, right }
      const { result } = run([{ do: 'write', target }], { from: 0 })
      const span = result.beats[0]
      const path = handPath('hero', result.tracks, { x: 0, y: 0, style: { height: H }, start: span.contact!, end: span.release!, every: 50 })
      expect(path[0].x).toBeCloseTo(left, 0)
      expect(path.at(-1)!.x).toBeCloseTo(right, 0)
      for (const point of path) expect(Math.abs(point.y - target.y)).toBeLessThan(0.05 * H)
      for (let i = 1; i < path.length; i++) expect(path[i].x).toBeGreaterThanOrEqual(path[i - 1].x - 4)
    }
  })

  it('pushes: both hands on the near side, carried along with it at a steady height', () => {
    const target = { x: 200, y: -90, left: 180, right: 220 }
    const { result, at } = run([{ do: 'push', target, to: 400 }], { from: 0 })
    const span = result.beats[0]
    for (const [time, edge] of [[span.contact!, 180], [(span.contact! + span.release!) / 2, 280], [span.release!, 380]]) {
      const { joints } = at(time)
      for (const side of ['left', 'right'] as const) {
        expect(Math.abs(joints.hands[side].x - edge)).toBeLessThan(0.06 * H)
        expect(Math.abs(joints.hands[side].y - target.y)).toBeLessThan(0.06 * H)
      }
    }
  })
})

describe('scriptTracks: which way it faces', () => {
  it('keeps a start facing left when the figure never turns, so its target is drawn that way', () => {
    const { tracks } = scriptTracks('hero', [{ do: 'walk', to: 300 }, { do: 'point', target: { x: 100, y: 200 } }], { from: 600, facing: -1 })
    expect(tracks.find((track) => track.property === 'facing')?.keyframes).toEqual([{ time: 0, value: -1 }])
  })

  it('leaves out facing when it starts right and never turns (the target’s default)', () => {
    const { tracks } = scriptTracks('hero', [{ do: 'walk', to: 300 }], {})
    expect(tracks.some((track) => track.property === 'facing')).toBe(false)
  })
})
