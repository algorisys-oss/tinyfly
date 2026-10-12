import { describe, it, expect, vi } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { TrackPlayer } from '../../engine/core/track'
import { quat, vec3, type Vec3, type Quat } from '../../engine/math'
import { validateScene3D } from '../../scene-3d/validate-scene'
import { loadScene3D } from '../../scene-3d/load-scene'
import { resolveScene3D } from '../../scene-3d/resolve-scene'
import { characterObjects } from '../../characters'
import { cricketClip, cricketField, cricketPlayer, cricketCameraTracks, cricketEventAt, CRICKET_ACTIONS, CRICKET_VIEWS, CRICKET_PITCH, type CricketClip, type CricketAction, type CricketCast, type CricketFormat } from './index'
import { cricketActor, cricketJoint, cricketPalm, restSample } from './cricket-motion'

function state(clip: CricketClip, time: number, id: string) {
  return new Timeline(clip.timeline).getStateAtTime(time).values.get(`${clip.scene.id}/${id}`) ?? new Map()
}
function point(clip: CricketClip, time: number, id = 'ball'): Vec3 {
  const values = state(clip, time, id)
  return ['x', 'y', 'z'].map(key => values.get(key)) as Vec3
}
function posed(clip: CricketClip, id: string, time: number) {
  const actor = cricketActor(clip.scene, id)
  const sample = restSample(actor)
  for (const [key, value] of state(clip, time, id)) {
    const index = ['x', 'y', 'z'].indexOf(key)
    if (index >= 0) sample.position[index] = value as number
    else sample.pose[key] = value as number
  }
  return { actor, sample, palm: (side: 'left' | 'right' = 'right') => cricketPalm(actor, sample, side) }
}
function near(a: Vec3, b: Vec3, tolerance = .015) { expect(vec3.distance(a, b)).toBeLessThan(tolerance) }

describe('cricket JSON API', () => {
  it('builds a standard pitch, a full fielding side, batters and umpires using owned organic presets', () => {
    const field = cricketField()
    expect(validateScene3D(field.scene)).toEqual([])
    expect(field.scene.objects.filter(o => o.kind === 'character')).toHaveLength(15)
    expect(field.landmarks['bowler-crease'][2]).toBeCloseTo(-8.84)
    expect(field.landmarks['striker-wicket'][2]).toBeCloseTo(10.06)
    const child = cricketPlayer({ id: 'kid', role: 'batter', preset: 'childGirl' })
    expect(child.height).toBe(1.24)
    expect(child.character?.figure).toBe('organic')
    const copy = cricketPlayer({ id: 'kid2', role: 'batter', preset: 'childGirl' })
    child.character!.skin = '#000000'
    expect(copy.character!.skin).not.toBe('#000000')
    expect(cricketField({ format: 'test' }).scene.objects.some(o => o.id === 'fielding-circle')).toBe(false)
  })
  it.each(Object.keys(CRICKET_ACTIONS) as CricketAction[])('compiles %s deterministically with valid channels and captions', action => {
    const clip = cricketClip({ action, every: 250 })
    expect(JSON.parse(JSON.stringify(clip))).toEqual(clip)
    expect(cricketClip({ action, every: 250 })).toEqual(clip)
    expect(validateScene3D(clip.scene, clip.timeline.tracks)).toEqual([])
    expect(new Set(clip.timeline.tracks.map(t => t.id)).size).toBe(clip.timeline.tracks.length)
    for (const track of clip.timeline.tracks) {
      if (!('keyframes' in track)) throw new Error('Expected baked keyframe tracks')
      expect(track.keyframes.every((k, i, all) => !i || k.time > all[i - 1].time)).toBe(true)
      for (const key of track.keyframes) expect((Array.isArray(key.value) ? key.value : [key.value]).every(Number.isFinite)).toBe(true)
    }
    expect(cricketEventAt(clip.events, 1899)?.id).toBe('setup')
    expect(cricketEventAt(clip.events, 1900)?.id).toBe('release')
    expect(cricketEventAt(clip.events, 6000)?.id).toBe('result')
  })
  it.each(['test', 'odi', 't20'] as CricketFormat[])('represents %s no-ball and wide outcomes explicitly', format => {
    const noBall = cricketClip({ format, action: 'no-ball', every: 1000 })
    expect(noBall.result).toMatchObject({ extras: 1, legalBall: false, freeHitNext: format !== 'test' })
    expect(cricketClip({ format, action: 'wide', every: 1000 }).result).toMatchObject({ extras: 1, legalBall: false, freeHitNext: false })
  })
  it('rejects invalid names, dimensions, sampling and transformed actors', () => {
    expect(() => cricketField({ format: 'constructor' as CricketFormat })).toThrow()
    expect(() => cricketField({ boundaryRadius: NaN })).toThrow()
    expect(() => cricketPlayer({ id: 'a', role: 'batter', height: 0 })).toThrow()
    expect(() => cricketClip({ action: '__proto__' as CricketAction })).toThrow()
    expect(() => cricketClip({ every: 0 })).toThrow()
    expect(() => cricketClip({ duration: Infinity })).toThrow()
    expect(() => cricketEventAt([], NaN)).toThrow()
  })
  it('gives every authored play distinct motion, including drive and ground fielding', () => {
    const plays = Object.keys(CRICKET_ACTIONS) as CricketAction[]
    const motion = plays.map(action => JSON.stringify(cricketClip({ action, every: 1000 }).timeline.tracks))
    expect(new Set(motion).size).toBe(plays.length)
  }, 15000)
})

describe('cricket camera regressions', () => {
  it.each(['field', 'overhead', 'orbit'] as const)('keeps a maximum-size ground inside the %s clipping range', view => {
    const clip = cricketClip({ boundaryRadius: 250, every: 1000 })
    const loaded = loadScene3D(clip.scene, { kinds: [characterObjects] })
    const timeline = new Timeline({ id: 'wide', tracks: cricketCameraTracks(clip, { view, every: 1000 }) })
    for (const time of [0, 1500, 3000, 4500, 6000]) {
      const frame = resolveScene3D(loaded, timeline.getStateAtTime(time).values, { width: 1280, height: 720 })
      for (const id of ['pitch', 'striker-stump-0', 'bowler-stump-0', 'ball']) {
        expect(frame.triangles.some(triangle => triangle.objectId === id), `${view} ${time} ${id}`).toBe(true)
      }
      expect(frame.camera.far).toBeGreaterThan(vec3.length(frame.camera.position) + clip.boundaryRadius + 1)
    }
    expect(cricketField().scene.objects.find(object => object.kind === 'camera')).toMatchObject({ far: 600 })
  })

  it.each(Object.keys(CRICKET_VIEWS).filter(view => view !== 'follow-ball') as Array<keyof typeof CRICKET_VIEWS>)('uses identical geometry for equivalent %s azimuths', view => {
    const clip = cricketClip({ every: 1000 })
    const tracks = cricketCameraTracks(clip, { view, yaw: 0, every: 1000 })
    for (const yaw of [360, 720, -360]) expect(cricketCameraTracks(clip, { view, yaw, every: 1000 })).toEqual(tracks)
    expect(cricketCameraTracks(clip, { view, yaw: -90, every: 1000 })).toEqual(cricketCameraTracks(clip, { view, yaw: 270, every: 1000 }))
  })

  it('follows only ball channels with linear keyframe access on a dense long clip', () => {
    const clip = cricketClip({ action: 'six', duration: 60000, every: 1000 })
    let reads = 0, keyCount = 0
    for (const track of clip.timeline.tracks) {
      if (!('keyframes' in track)) throw new Error('Expected baked tracks')
      if (track.target === `${clip.scene.id}/ball`) {
        const sampler = new TrackPlayer(track)
        const keys = Array.from({ length: 3751 }, (_, index) => ({ time: index * 16, value: sampler.getValueAtTime(index * 16)! }))
        keyCount += keys.length
        track.keyframes = new Proxy(keys, { get(target, property, receiver) {
          if (typeof property === 'string' && /^\d+$/.test(property)) reads++
          return Reflect.get(target, property, receiver)
        } })
      } else Object.defineProperty(track, 'keyframes', { get() { throw new Error('Camera sampled an unrelated actor') } })
    }
    const timelineSample = vi.spyOn(Timeline.prototype, 'getStateAtTime')
    try {
      const tracks = cricketCameraTracks(clip, { view: 'follow-ball', every: 17 })
      expect(timelineSample).not.toHaveBeenCalled()
      expect(tracks[0].keyframes.at(-1)?.time).toBe(60000)
      expect(reads).toBeLessThan(10 * (keyCount + tracks[0].keyframes.length))
    } finally { timelineSample.mockRestore() }
  })

  it('matches ball interpolation at camera sample times, including the endpoint', () => {
    const clip = cricketClip({ action: 'spin', every: 137 })
    const motion = new Timeline(clip.timeline)
    const tracks = cricketCameraTracks(clip, { view: 'follow-ball', every: 73 })
    const position = tracks.find(track => track.property === 'position')!
    const lookAt = tracks.find(track => track.property === 'lookAt')!
    for (const [index, key] of lookAt.keyframes.entries()) {
      const values = motion.getStateAtTime(key.time).values.get('cricket/ball')!
      const ball = ['x', 'y', 'z'].map(axis => values.get(axis)) as Vec3
      expect(key.value).toEqual(ball)
      expect(position.keyframes[index].value).toEqual(vec3.add(ball, [5, 3, 6]))
    }
    expect(lookAt.keyframes.at(-1)?.time).toBe(clip.duration)
  })
})

describe.each(['adults', 'children', 'mixed'] as CricketCast[])('%s cricket contacts', cast => {
  it('gathers a distinct ground-fielding path at the rendered palm', () => {
    const clip = cricketClip({ action: 'fielding', cast, every: 1000 })
    for (const time of [4200, 4500]) near(point(clip, time), posed(clip, 'fielder', time).palm())
  })
  it('releases from the real palm, grounds the front foot, and illustrates a foot no-ball', () => {
    for (const action of ['bowling', 'no-ball'] as CricketAction[]) {
      const clip = cricketClip({ action, cast, every: 100 })
      const bowler = posed(clip, 'bowler', 1900)
      near(point(clip, 1900), bowler.palm())
      const foot = vec3.add(bowler.sample.position, [0, 0, 0])
      const ankle = cricketJoint(bowler.actor, bowler.sample, 'leg.right', 2)
      expect(ankle[1]).toBeLessThan(.12)
      expect(action === 'no-ball' ? ankle[2] > -8.84 : ankle[2] < -8.84).toBe(true)
      expect(foot.every(Number.isFinite)).toBe(true)
    }
  })
  it.each(['batting', 'defend'] as const)('keeps both hands on the %s bat and meets the blade at contact', action => {
    const clip = cricketClip({ action, cast, every: 100 })
    const scale = posed(clip, 'batter', 0).actor.who.height / 1.78
    for (const time of [0, 2100, 2450, 2600, 2900, 3250, 4000]) {
      const bat = state(clip, time, 'bat')
      const grip = bat.get('position') as Vec3
      const axis = quat.rotateVec3(bat.get('quaternion') as Quat, [0, 1, 0])
      const batter = posed(clip, 'batter', time)
      near(batter.palm(), grip)
      near(batter.palm('left'), vec3.add(grip, vec3.scale(axis, .105 * scale)), .025)
      if (time === 2900) near(point(clip, time), vec3.add(grip, vec3.scale(axis, .51 * scale)))
      if (action === 'defend') {
        expect(axis[0]).toBeCloseTo(0)
        expect(axis[1]).toBeLessThan(-.99)
        expect(axis[2]).toBeLessThan(0)
      }
    }
    expect(cricketEventAt(clip.events, 2900)).toMatchObject({ id: 'contact', kind: 'contact', label: 'Bat contact' })
    expect(clip.timeline.captions?.en.contact).toContain('The ball meets the blade')
    expect(clip.events.some(event => event.id === 'miss')).toBe(false)
    if (action === 'defend') {
      expect(point(clip, 3400)[1]).toBeCloseTo(.075)
      expect(point(clip, 3400)[2]).toBeLessThan(point(clip, 2900)[2])
      expect(clip.result).toMatchObject({ runs: 0, wickets: 0 })
    }
  })
  it.each(['bowling', 'spin', 'no-ball', 'wide', 'stumping'] as const)('keeps the complete %s delivery clear of intact striker stumps before palm collection', action => {
    for (const duration of [4000, 6000, 60000]) {
      const clip = cricketClip({ action, cast, duration, every: 1000 })
      const caughtAt = clip.events.find(event => event.id === 'keeper')!.time
      const ball = clip.scene.objects.find(object => object.id === 'ball')!
      if (ball.kind !== 'mesh' || ball.geometry.type !== 'sphere') throw new Error('Expected spherical ball')
      const channels = ['x', 'y', 'z'].map(axis => {
        const track = clip.timeline.tracks.find(track => track.id === `ball-${axis}`)!
        if (!('keyframes' in track)) throw new Error('Expected ball keyframes')
        return track.keyframes
      })
      const points = channels[0].map((key, index) => ({ time: key.time, position: channels.map(channel => channel[index].value) as Vec3 }))
      for (const stump of clip.scene.objects.filter(object => object.id.startsWith('striker-stump-'))) {
        if (stump.kind !== 'mesh' || stump.geometry.type !== 'cylinder') throw new Error('Expected cylindrical stump')
        const center = stump.position!
        const bottom = center[1] - stump.geometry.height / 2 - ball.geometry.radius
        const top = center[1] + stump.geometry.height / 2 + ball.geometry.radius
        for (let index = 1; index < points.length; index++) {
          const start = points[index - 1], end = points[index]
          if (start.time < 2450 * duration / 6000 || end.time > caughtAt) continue
          const from = start.position, delta = vec3.subtract(end.position, from)
          let low = 0, high = 1
          if (delta[1] === 0) {
            if (from[1] < bottom || from[1] > top) continue
          } else {
            const a = (bottom - from[1]) / delta[1], b = (top - from[1]) / delta[1]
            low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b))
            if (low > high) continue
          }
          const lengthSquared = delta[0] ** 2 + delta[2] ** 2
          const nearest = lengthSquared ? ((center[0] - from[0]) * delta[0] + (center[2] - from[2]) * delta[2]) / lengthSquared : low
          const t = Math.max(low, Math.min(high, nearest))
          const distance = Math.hypot(from[0] + delta[0] * t - center[0], from[2] + delta[2] * t - center[2])
          expect(distance, `${cast} ${action} ${duration} ${stump.id} ${start.time}-${end.time}`).toBeGreaterThan(ball.geometry.radius + stump.geometry.radius)
          if (action !== 'wide' && from[2] <= center[2] && end.position[2] >= center[2]) {
            const cross = (center[2] - from[2]) / delta[2]
            expect(from[0] + delta[0] * cross).toBeLessThan(-CRICKET_PITCH.wicketWidth / 2 - ball.geometry.radius)
          }
        }
      }
      near(point(clip, caughtAt), posed(clip, 'keeper', caughtAt).palm())
      expect(clip.result).toMatchObject({ runs: 0, extras: action === 'no-ball' || action === 'wide' ? 1 : 0, wickets: action === 'stumping' ? 1 : 0 })
      for (const id of ['striker-bail-0', 'striker-bail-1']) {
        const initial = clip.scene.objects.find(object => object.id === id)!.position
        expect(state(clip, caughtAt, id).get('position') ?? initial).toEqual(initial)
      }
    }
  })
  it('retains the intentional bowled collision with the middle stump', () => {
    const clip = cricketClip({ action: 'bowled', cast, every: 1000 })
    const time = clip.events.find(event => event.id === 'wicket')!.time
    near(point(clip, time), [0, .36, CRICKET_PITCH.length / 2])
    expect(clip.result.dismissal).toBe('bowled')
  })
  it('controls a catch and a stumping ball with the rendered hand', () => {
    const caught = cricketClip({ action: 'catch', cast, every: 100 })
    near(point(caught, 4100), posed(caught, 'fielder', 4100).palm())
    expect(point(caught, 3600)[1]).toBeGreaterThan(1)
    near(point(caught, 5500), posed(caught, 'fielder', 5500).palm())
    const stump = cricketClip({ action: 'stumping', cast, every: 100 })
    near(point(stump, 3900), posed(stump, 'keeper', 3900).palm())
    near(point(stump, 3900), [0, CRICKET_PITCH.stumpHeight, 10.06], .09)
    expect(posed(stump, 'batter', 3900).sample.position[2]).toBeLessThan(8.84)
  })
})

describe('cricket camera tracks', () => {
  it('scales contacts with duration and separates running, run-out and boundary outcomes', () => {
    const shortened = cricketClip({ action: 'batting', duration: 4000, every: 1000 })
    const contact = shortened.events.find(e => e.id === 'contact')!.time
    expect(contact).toBeCloseTo(2900 * 2 / 3)
    expect(shortened.timeline.tracks.filter(t => t.id.startsWith('ball-')).every(t => 'keyframes' in t && t.keyframes.some(k => k.time === contact))).toBe(true)
    const running = cricketClip({ action: 'running', every: 1000 })
    expect(posed(running, 'batter', 5500).sample.position[2]).toBeLessThan(-8.84)
    expect(posed(running, 'non-striker', 5500).sample.position[2]).toBeGreaterThan(8.84)
    const runOut = cricketClip({ action: 'run-out', every: 1000 })
    expect(posed(runOut, 'batter', 5000).sample.position[2]).toBeGreaterThan(-8.84)
    near(point(runOut, 5000), [0, .42, -10.06])
    const bail = runOut.scene.objects.find(o => o.id === 'bowler-bail-0')!
    expect(state(runOut, 4999, bail.id).get('position')).toEqual(bail.position)
    expect((state(runOut, 5650, bail.id).get('position') as Vec3)[1]).toBeCloseTo(.035)
    for (const action of ['four', 'six'] as CricketAction[]) {
      const clip = cricketClip({ action, every: 1000 })
      expect(Math.hypot(point(clip, 5000)[0], point(clip, 5000)[2])).toBeCloseTo(64)
      expect(action === 'four' ? point(clip, 5000)[1] < .1 : point(clip, 5000)[1] > 2).toBe(true)
    }
  })
  it('supports all views, a full orbit and a time-based ball follower', () => {
    const clip = cricketClip({ action: 'six', every: 100 })
    for (const view of Object.keys(CRICKET_VIEWS) as Array<keyof typeof CRICKET_VIEWS>) {
      const tracks = cricketCameraTracks(clip, { view, every: 100 })
      expect(validateScene3D(clip.scene, [...clip.timeline.tracks, ...tracks])).toEqual([])
    }
    const orbit = new Timeline({ id: 'orbit', tracks: cricketCameraTracks(clip, { view: 'orbit' }) })
    const camera = (time: number) => orbit.getStateAtTime(time).values.get('cricket/camera')!.get('position') as Vec3
    near(camera(0), camera(6000))
    expect(vec3.distance(camera(0), camera(3000))).toBeGreaterThan(100)
    const follow = new Timeline({ id: 'follow', tracks: cricketCameraTracks(clip, { view: 'follow-ball', every: 100 }) })
    near(follow.getStateAtTime(2900).values.get('cricket/camera')!.get('lookAt') as Vec3, point(clip, 2900))
  })
})
