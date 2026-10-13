import { describe, expect, it } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { vec3, type Vec3 } from '../../engine/math'
import { validateScene3D } from '../../scene-3d/validate-scene'
import { capabilities } from '../../characters/capabilities'
import { cricketPlay, cricketPlayClip, cricketField, cricketClip, CRICKET_PLAY_EXAMPLES, CRICKET_PLAY_COMPONENTS, type CricketPlayClip, type CricketPlayOptions, type CricketCast, type CricketFormat } from './index'
import { cricketActor, cricketPalm, cricketJoint, restSample } from './cricket-motion'

function values(clip: CricketPlayClip, id: string, time: number) {
  return new Timeline(clip.timeline).getStateAtTime(time).values.get(`${clip.scene.id}/${id}`) ?? new Map()
}
function point(clip: CricketPlayClip, time: number): Vec3 {
  const state = values(clip, 'ball', time)
  return ['x', 'y', 'z'].map(key => state.get(key)) as Vec3
}
function actorAt(clip: CricketPlayClip, id: string, time: number) {
  const actor = cricketActor(clip.scene, id), sample = restSample(actor)
  for (const [key, value] of values(clip, id, time)) {
    const axis = ['x', 'y', 'z'].indexOf(key)
    if (axis >= 0) sample.position[axis] = value as number
    else sample.pose[key] = value as number
  }
  return { actor, sample }
}

const dismissals = [
  { finish: 'stumps', decision: { dismissal: 'bowled' } },
  { finish: 'pad', decision: { dismissal: 'lbw' } },
  { fielding: 'stumping', decision: { dismissal: 'stumped' } },
  { shot: 'drive', fielding: 'catch', decision: { dismissal: 'caught' } },
] satisfies CricketPlayOptions[]

describe('composed cricket plays', () => {
  it.each(['test', 'odi', 't20'] as CricketFormat[])('%s no-ball protects all supported non-run-out dismissals', format => {
    for (const options of dismissals) {
      const clip = cricketPlayClip({ ...options, format, delivery: { legality: 'no-ball' }, every: 1000 })
      expect(clip.result).toEqual({ runs: 0, extras: 1, wickets: 0, legalBall: false, freeHitNext: format !== 'test' })
      expect(clip.ruling).toEqual({ dismissal: null, reason: 'no-ball' })
      expect(clip.play.decision.dismissal).toBe(options.decision.dismissal)
      expect(values(clip, 'umpire', 5700).get('arm.right.swing') ?? 0).toBe(0)
      expect(values(clip, 'umpire', 5700).get('arm.right.spread')).toBe(90)
      expect(clip.events.at(-1)).toMatchObject({ label: 'Not out' })
      expect(clip.events.at(-1)!.caption).toContain('no-ball')
      if (clip.action !== 'lbw' && clip.action !== 'catch') expect(clip.timeline.tracks.some(t => t.id.endsWith('-bail-0-fall'))).toBe(true)
    }
  })
  it.each(['odi', 't20'] as const)('%s legal free hit protects dismissals and consumes the current context', format => {
    for (const options of dismissals) {
      const clip = cricketPlayClip({ ...options, format, context: { freeHit: true }, every: 1000 })
      expect(clip.result).toEqual({ runs: 0, extras: 0, wickets: 0, legalBall: true, freeHitNext: false })
      expect(clip.ruling).toEqual({ dismissal: null, reason: 'free-hit' })
      expect(values(clip, 'umpire', 5700).get('arm.right.swing') ?? 0).toBe(0)
      expect(clip.events.at(-1)!.caption).toContain('consumes the free hit')
    }
  })
  it('preserves physical catch motion exactly when decision context changes', () => {
    const legal = cricketPlayClip({ shot: 'drive', fielding: 'catch', decision: { dismissal: 'caught' } })
    const freeHit = cricketPlayClip({ shot: 'drive', fielding: 'catch', decision: { dismissal: 'caught' }, context: { freeHit: true } })
    expect(freeHit.timeline.tracks.filter(t => !t.target.endsWith('/umpire'))).toEqual(legal.timeline.tracks.filter(t => !t.target.endsWith('/umpire')))
    expect(legal.result).toMatchObject({ wickets: 1, dismissal: 'caught' })
    expect(values(legal, 'umpire', 5700).get('arm.right.swing')).toBe(165)
    expect(legal.events.at(-1)!.label).toBe('Out')
  })
  it('does not infer a dismissal from physical stumps, pads or a catch', () => {
    for (const { decision: _decision, ...options } of dismissals) {
      const clip = cricketPlayClip({ ...options, every: 1000 })
      expect(clip.play.decision).toEqual({ dismissal: null })
      expect(clip.ruling.reason).toBe('no-dismissal')
      expect(clip.result.wickets).toBe(0)
      expect(values(clip, 'umpire', 5700).get('arm.right.swing') ?? 0).toBe(0)
    }
  })
  it('allows authored run-out on no-ball and free hit and sequences the signals', () => {
    for (const legality of ['legal', 'no-ball'] as const) for (const freeHit of [false, true]) {
      const clip = cricketPlayClip({ shot: 'drive', fielding: 'run-out', delivery: { legality }, context: { freeHit }, decision: { dismissal: 'run-out' }, every: 1000 })
      expect(clip.result).toMatchObject({ wickets: 1, dismissal: 'run-out', extras: legality === 'legal' ? 0 : 1, freeHitNext: legality === 'no-ball' })
      expect(values(clip, 'umpire', 5700).get('arm.right.swing')).toBe(165)
      if (legality === 'no-ball') expect(values(clip, 'umpire', 2900).get('arm.right.spread')).toBe(90)
    }
  })
  it('scores the supported bat finishes separately from the no-ball penalty', () => {
    for (const [finish, runs] of [['single', 1], ['four', 4], ['six', 6]] as const) {
      const clip = cricketPlayClip({ shot: 'drive', finish, delivery: { legality: 'no-ball' }, every: 1000 })
      expect(clip.result).toEqual({ runs, extras: 1, wickets: 0, legalBall: false, freeHitNext: true })
      if (finish === 'six') expect(values(clip, 'umpire', 5700).get('arm.left.spread')).toBe(180)
    }
  })
  it('carries a current free hit over either illegal delivery; legal delivery consumes it', () => {
    for (const legality of ['no-ball', 'wide', 'legal'] as const) {
      const clip = cricketPlayClip({ delivery: { legality }, context: { freeHit: true }, every: 1000 })
      expect(clip.result.freeHitNext).toBe(legality !== 'legal')
      expect(clip.result.legalBall).toBe(legality === 'legal')
      expect(clip.result.extras).toBe(legality === 'legal' ? 0 : 1)
    }
    expect(cricketPlayClip({ delivery: { legality: 'wide' }, every: 1000 }).result.freeHitNext).toBe(false)
  })
  it.each(['adults', 'men', 'children', 'mixed'] as CricketCast[])('retains native release, catch and wicket contacts for %s at sparse/scaled sampling', cast => {
    for (const duration of [4000, 12000]) for (const style of ['pace', 'spin'] as const) {
      const scale = duration / 6000
      const caught = cricketPlayClip({ ...CRICKET_PLAY_EXAMPLES['free-hit-catch'].options, delivery: { style, legality: 'no-ball' }, cast, duration, every: 1000 })
      for (const [id, time] of [['bowler', 1900], ['fielder', 4100]] as const) {
        const { actor, sample } = actorAt(caught, id, time * scale)
        expect(vec3.distance(point(caught, time * scale), cricketPalm(actor, sample, 'right'))).toBeLessThan(.015)
      }
      const stumps = cricketPlayClip({ ...CRICKET_PLAY_EXAMPLES['no-ball-stumps'].options, delivery: { style, legality: 'no-ball' }, cast, duration, every: 1000 })
      expect(vec3.distance(point(stumps, 3200 * scale), [0, .36, 10.06])).toBeLessThan(1e-10)
      const { actor, sample } = actorAt(stumps, 'bowler', 1900 * scale)
      const foot = cricketJoint(actor, sample, 'leg.right', 2)
      expect(foot[2]).toBeGreaterThan(-8.84)
      expect(foot[1]).toBeLessThan(.15)
      const fallen = values(stumps, 'striker-bail-0', 4000 * scale).get('position') as Vec3
      expect(fallen[1]).toBe(.035)
      expect(validateScene3D(stumps.scene, stumps.timeline.tracks)).toEqual([])
    }
  })
  it('produces owned deterministic JSON and supports composing on an existing field', () => {
    const field = cricketField(), before = JSON.stringify(field)
    const input: CricketPlayOptions = { shot: 'drive', fielding: 'catch', delivery: { style: 'spin' }, context: { freeHit: true }, decision: { dismissal: 'caught' }, every: 1000 }
    const first = cricketPlay(field, input)
    expect(JSON.stringify(field)).toBe(before)
    expect(cricketPlay(field, input)).toEqual(first)
    expect(JSON.parse(JSON.stringify(first))).toEqual(first)
    input.delivery!.style = 'pace'; input.context!.freeHit = false; input.decision!.dismissal = null
    expect(first.play).toMatchObject({ delivery: { style: 'spin' }, context: { freeHit: true }, decision: { dismissal: 'caught' } })
    const recompiled = cricketPlay(field, { ...first.play, every: 1000 })
    expect(recompiled).toEqual(first)
  })
  it('exposes frozen choices/examples through capability discovery', () => {
    expect(capabilities().sports.cricket.playComponents).toEqual(CRICKET_PLAY_COMPONENTS)
    expect(capabilities().sports.cricket.playExamples).toEqual(CRICKET_PLAY_EXAMPLES)
    expect(Object.isFrozen(CRICKET_PLAY_COMPONENTS.shots)).toBe(true)
    for (const example of Object.values(CRICKET_PLAY_EXAMPLES)) {
      expect(cricketPlayClip({ ...example.options, every: 1000 }).timeline.tracks.length).toBeGreaterThan(0)
      expect(Object.isFrozen(example.options)).toBe(true)
    }
  })
  it('rejects impossible, unsupported and incompatible authored input', () => {
    const bad: CricketPlayOptions[] = [
      { delivery: { style: 'constructor' as 'pace' } },
      { delivery: { legality: 'bad' as 'legal' } },
      { shot: 'constructor' as 'miss' }, { finish: 'bad' as 'none' }, { fielding: 'bad' as 'none' },
      { decision: { dismissal: 'bad' as 'caught' } },
      { context: { freeHit: 1 as unknown as boolean } },
      { decision: { dismissal: 'caught' } },
      { delivery: { legality: 'wide' }, shot: 'drive' },
      { shot: 'drive', fielding: 'catch', finish: 'six' },
      { shot: 'defend', fielding: 'throw' }, { shot: 'miss', finish: 'single' },
      { duration: NaN }, { every: 0 },
    ]
    for (const options of bad) expect(() => cricketPlayClip(options)).toThrow()
    expect(() => cricketPlayClip({ format: 'test', context: { freeHit: true } })).toThrow('Test')
  })
  it('keeps the single-action interface and result shape', () => {
    const legacy = cricketClip({ action: 'catch', every: 1000 })
    expect(legacy.result).toEqual({ runs: 0, extras: 0, wickets: 1, legalBall: true, freeHitNext: false, dismissal: 'caught' })
    expect(legacy).not.toHaveProperty('play')
    expect(legacy.events.at(-1)!.label).toBe('Illustrated result')
  })
})
