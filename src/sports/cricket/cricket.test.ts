import { describe, it, expect, vi } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { TrackPlayer } from '../../engine/core/track'
import { quat, vec3, type Vec3, type Quat } from '../../engine/math'
import { validateScene3D } from '../../scene-3d/validate-scene'
import { loadScene3D } from '../../scene-3d/load-scene'
import { resolveScene3D } from '../../scene-3d/resolve-scene'
import { characterObjects, SOFT_CARTOON_CAST, capabilities } from '../../characters'
import { stagePlanSpace } from '../../characters/rig/skeleton'
import { cricketClip, cricketField, cricketPlayer, cricketCameraTracks, cricketEventAt, CRICKET_ACTIONS, CRICKET_CASTS, CRICKET_FIELDING_POSITIONS, CRICKET_VIEWS, CRICKET_PITCH, type CricketClip, type CricketAction, type CricketCast, type CricketFormat } from './index'
import { cricketActor, cricketJoint, cricketPalm, restSample } from './cricket-motion'

function state(clip: CricketClip, time: number, id: string, motion = new Timeline(clip.timeline)) {
  return motion.getStateAtTime(time).values.get(`${clip.scene.id}/${id}`) ?? new Map()
}
function point(clip: CricketClip, time: number, id = 'ball'): Vec3 {
  const values = state(clip, time, id)
  return ['x', 'y', 'z'].map(key => values.get(key)) as Vec3
}
function posed(clip: CricketClip, id: string, time: number, motion = new Timeline(clip.timeline)) {
  const actor = cricketActor(clip.scene, id)
  const sample = restSample(actor)
  for (const [key, value] of state(clip, time, id, motion)) {
    const index = ['x', 'y', 'z'].indexOf(key)
    if (index >= 0) sample.position[index] = value as number
    else sample.pose[key] = value as number
  }
  return { actor, sample, palm: (side: 'left' | 'right' = 'right') => cricketPalm(actor, sample, side) }
}
function near(a: Vec3, b: Vec3, tolerance = .015) { expect(vec3.distance(a, b)).toBeLessThan(tolerance) }

function segmentDistance(a: Vec3, b: Vec3, c: Vec3, d: Vec3): number {
  const u = vec3.subtract(b, a), v = vec3.subtract(d, c), w = vec3.subtract(a, c)
  const uu = vec3.dot(u, u), vv = vec3.dot(v, v), uv = vec3.dot(u, v)
  const uw = vec3.dot(u, w), vw = vec3.dot(v, w)
  const pointDistance = (p: Vec3, from: Vec3, delta: Vec3, length: number) => {
    const t = length ? Math.max(0, Math.min(1, vec3.dot(vec3.subtract(p, from), delta) / length)) : 0
    return vec3.distance(p, vec3.add(from, vec3.scale(delta, t)))
  }
  const distances = [pointDistance(a, c, v, vv), pointDistance(b, c, v, vv), pointDistance(c, a, u, uu), pointDistance(d, a, u, uu)]
  const denominator = uu * vv - uv * uv
  if (denominator > 1e-12) {
    const s = (uv * vw - vv * uw) / denominator, t = (uu * vw - uv * uw) / denominator
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) distances.push(vec3.distance(vec3.add(a, vec3.scale(u, s)), vec3.add(c, vec3.scale(v, t))))
  }
  return Math.min(...distances)
}

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
  it('exports exactly eleven stock fielding labels as owned player JSON', () => {
    expect(Object.keys(CRICKET_FIELDING_POSITIONS)).toHaveLength(11)
    expect(CRICKET_FIELDING_POSITIONS.fielder).toBe('Extra cover')
    expect(Object.keys(CRICKET_FIELDING_POSITIONS)).not.toContain('long-on')
    expect(capabilities().sports.cricket.fieldingPositions).toEqual(CRICKET_FIELDING_POSITIONS)
    for (const cast of Object.keys(CRICKET_CASTS) as CricketCast[]) {
      const field = cricketField({ cast }), copy = JSON.parse(JSON.stringify(field))
      for (const [id, label] of Object.entries(CRICKET_FIELDING_POSITIONS)) {
        expect(copy.scene.objects.find((object: { id: string }) => object.id === id)).toMatchObject({ kind: 'character', name: label })
      }
      expect(copy.scene.objects.filter((object: { kind: string }) => object.kind === 'character')).toHaveLength(15)
      expect(copy.scene.objects.filter((object: { name: string }) => object.name === 'batter')).toHaveLength(2)
      expect(copy.scene.objects.filter((object: { name: string }) => object.name === 'umpire')).toHaveLength(2)
      const midOn = field.landmarks['mid-on'], midOff = field.landmarks['mid-off']
      expect(midOn[0]).toBeLessThan(0); expect(midOff[0]).toBeGreaterThan(0)
      copy.scene.objects.find((object: { id: string }) => object.id === 'fielder').name = 'changed'
      expect(cricketField({ cast }).scene.objects.find(object => object.id === 'fielder')!.name).toBe('Extra cover')
    }
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

function headAt(clip: CricketClip, id: string, time: number, motion?: Timeline) {
  const { actor, sample } = posed(clip, id, time, motion)
  const head = stagePlanSpace(actor.who.plan, sample.pose, { height: actor.who.height, contact: actor.who.contact }).head
  return { center: vec3.add(sample.position, head.center), forward: head.axes[2] }
}
function horizontalAlignment(from: Vec3, forward: Vec3, target: Vec3) {
  return vec3.dot(vec3.normalize([forward[0], 0, forward[2]]), vec3.normalize([target[0] - from[0], 0, target[2] - from[2]]))
}

describe('cricket facing and stance', () => {
  it('exposes an owned male organic cast for every player and umpire', () => {
    const field = cricketField({ cast: 'men' })
    expect(capabilities().sports.cricket.casts).toEqual(CRICKET_CASTS)
    const players = field.scene.objects.filter(object => object.kind === 'character')
    expect(players).toHaveLength(15)
    for (const player of players) if (player.kind === 'character') {
      expect(player.character).toMatchObject({ figure: 'organic', shoulderWidth: SOFT_CARTOON_CAST.youngMan.shoulderWidth, face: SOFT_CARTOON_CAST.youngMan.face, hair: SOFT_CARTOON_CAST.youngMan.hair })
    }
    expect(() => cricketField({ cast: 'constructor' as CricketCast })).toThrow()
  })

  it.each(['adults', 'men', 'children', 'mixed'] as CricketCast[])('grounds a side-on right-handed %s guard, looking toward the bowler', cast => {
    const clip = cricketClip({ action: 'batting', cast, every: 1000 })
    const batter = posed(clip, 'batter', 0)
    const front = cricketJoint(batter.actor, batter.sample, 'leg.left', 2)
    const back = cricketJoint(batter.actor, batter.sample, 'leg.right', 2)
    const leftShoulder = cricketJoint(batter.actor, batter.sample, 'arm.left', 0)
    const rightShoulder = cricketJoint(batter.actor, batter.sample, 'arm.right', 0)
    expect(front[1]).toBeLessThan(.02); expect(back[1]).toBeLessThan(.02)
    expect(back[2] - front[2]).toBeGreaterThan(batter.actor.who.height * .2)
    expect(leftShoulder[2]).toBeLessThan(rightShoulder[2])
    expect(Math.abs(leftShoulder[0] - rightShoulder[0])).toBeLessThan(.01)
    const head = headAt(clip, 'batter', 0)
    expect(horizontalAlignment(head.center, head.forward, posed(clip, 'bowler', 0).sample.position)).toBeGreaterThan(.99)
    const bat = state(clip, 0, 'bat'), axis = quat.rotateVec3(bat.get('quaternion') as Quat, [0, 1, 0])
    const toe = vec3.add(bat.get('position') as Vec3, vec3.scale(axis, .78 * batter.actor.who.height / 1.78))
    expect(toe[1]).toBeGreaterThanOrEqual(0); expect(toe[1]).toBeLessThan(.02)
    expect(Math.hypot(toe[0] - back[0], toe[2] - back[2])).toBeLessThan(.4)
  })

  it.each(['batting', 'six', 'catch', 'wide', 'stumping'] as CricketAction[])('makes the complete %s field watch the bowler then track the delivery and stroke', action => {
    const clip = cricketClip({ action, every: 100 })
    for (const id of ['fielder', 'slip', 'point', 'cover', 'mid-off', 'mid-on', 'square-leg', 'fine-leg', 'third-man']) {
      for (const time of [0, 1800, 2250, 2800, 3500, 4800]) {
        // The collecting fielder must also turn/run/reach. Check that role
        // before its run; the surrounding fielders follow every later ball.
        if (id === 'fielder' && ['batting', 'catch'].includes(action) && time > 3050) continue
        const target = time <= 1900 ? posed(clip, 'bowler', time).sample.position : point(clip, time)
        const head = headAt(clip, id, time)
        expect(horizontalAlignment(head.center, head.forward, target), `${action} ${id} ${time}`).toBeGreaterThan(.995)
      }
    }
    const bowler = headAt(clip, 'bowler', 0)
    expect(horizontalAlignment(bowler.center, bowler.forward, posed(clip, 'batter', 0).sample.position)).toBeGreaterThan(.99)
    const unchanged = JSON.stringify(clip.timeline)
    cricketCameraTracks(clip, { view: 'orbit' }); cricketCameraTracks(clip, { view: 'batter', yaw: 270 })
    expect(JSON.stringify(clip.timeline)).toBe(unchanged)
  })

  it.each(['bowling', 'spin', 'no-ball', 'wide', 'stumping', 'batting'] as CricketAction[])('aims keeper and slip toward world targets during %s', action => {
    for (const cast of ['men', 'children'] as CricketCast[]) {
      const clip = cricketClip({ action, cast, every: 1000 })
      for (const id of ['keeper', 'slip']) for (const time of [0, 1800, 2250, 2800, 3050, 3200, 3400, 4900]) {
        const target = id === 'keeper' || time > 1900 ? point(clip, time) : posed(clip, 'bowler', time).sample.position
        const head = headAt(clip, id, time)
        const direction = vec3.subtract(target, head.center)
        if (Math.hypot(direction[0], direction[2]) < posed(clip, id, time).actor.who.height * .05) {
          expect(head.forward[1]).toBeLessThan(-.7)
          expect(vec3.dot(head.forward, vec3.normalize(direction))).toBeGreaterThan(.75)
        } else expect(horizontalAlignment(head.center, head.forward, target), `${action} ${cast} ${id} ${time}`).toBeGreaterThan(.995)
        if (id === 'keeper' && time === 2800) {
          const body = posed(clip, id, time).sample.pose.turn! * Math.PI / 2
          expect(Math.abs(Math.sin(body) * head.forward[2] - Math.cos(body) * head.forward[0])).toBeGreaterThan(.001)
        }
      }
      const original = JSON.stringify(clip.timeline)
      for (const view of ['pitch', 'keeper', 'orbit'] as const) cricketCameraTracks(clip, { view, yaw: 270, every: 1000 })
      expect(JSON.stringify(clip.timeline)).toBe(original)
    }
  })

  it.each(['adults', 'men', 'children', 'mixed'] as CricketCast[])('keeps the %s striker, keeper and slip watching the incoming ball through the bounce', cast => {
    for (const action of ['bowling', 'spin', 'wide', 'stumping', 'batting', 'defend'] as CricketAction[]) {
      const clip = cricketClip({ action, cast, every: 1000 }), motion = new Timeline(clip.timeline)
      for (const time of [2100, 2250, 2450, 2600, 2800]) {
        const values = state(clip, time, 'ball', motion)
        const target = ['x', 'y', 'z'].map(axis => values.get(axis)) as Vec3
        for (const id of ['batter', 'keeper', 'slip']) {
          const head = headAt(clip, id, time, motion)
          expect(horizontalAlignment(head.center, head.forward, target), `${cast} ${action} ${id} ${time}`).toBeGreaterThan(.995)
        }
      }
    }
  }, 15000)

  it('keeps running players and a collecting fielder facing their travel', () => {
    const clip = cricketClip({ action: 'running', every: 100 })
    for (const id of ['batter', 'non-striker', 'fielder']) {
      const from = posed(clip, id, 3350), to = posed(clip, id, 3400)
      const angle = (from.sample.pose.turn ?? 0) * Math.PI / 2
      expect(horizontalAlignment(from.sample.position, [Math.sin(angle), 0, Math.cos(angle)], to.sample.position)).toBeGreaterThan(.99)
    }
  })

  it.each((['running', 'run-out'] as const).flatMap(action =>
    (['adults', 'men', 'children', 'mixed'] as CricketCast[]).map(cast => ({ action, cast })),
  ))('preserves both $cast batter handoff headings in $action plays', ({ action, cast }) => {
    const reference = new Map<string, number[]>()
    for (const [duration, every] of [[6000, 40], [6000, 137], [6000, 1000], [4000, 1000], [60000, 1000]]) {
      const clip = cricketClip({ action, cast, duration, every }), motion = new Timeline(clip.timeline)
      const actual = (phase: number) => phase * duration / 6000
      for (const id of ['batter', 'non-striker']) {
        const turn = (phase: number) => posed(clip, id, actual(phase), motion).sample.pose.turn!
        const start = turn(3050), end = turn(3250), direction = Math.sign(end - start)
        expect(Math.abs(turn(3051) - start), `${cast} ${id} ${duration}/${every} handoff`).toBeLessThan(.005)
        for (let time = 3050; time < 3250; time += 10) {
          const delta = turn(time + 10) - turn(time)
          expect(delta * direction, `${cast} ${id} ${duration}/${every} ${time}`).toBeGreaterThanOrEqual(-1e-10)
          expect(Math.abs(delta)).toBeLessThan(.12)
        }
        const from = posed(clip, id, actual(3250), motion), to = posed(clip, id, actual(3300), motion)
        const angle = end * Math.PI / 2
        expect(horizontalAlignment(from.sample.position, [Math.sin(angle), 0, Math.cos(angle)], to.sample.position)).toBeGreaterThan(.999)
        const turns = [3050, 3100, 3200, 3250].map(turn)
        const previous = reference.get(id)
        if (previous) turns.forEach((value, index) => expect(value).toBeCloseTo(previous[index], 10))
        else reference.set(id, turns)
        const batId = id === 'batter' ? 'bat' : 'non-striker-bat'
        for (const phase of [3100, 3200, 3250, 4000, 5500]) {
          const grip = state(clip, actual(phase), batId, motion).get('position') as Vec3
          near(grip, posed(clip, id, actual(phase), motion).palm())
        }
      }
      const batter = posed(clip, 'batter', actual(2900), motion)
      const bat = state(clip, actual(2900), 'bat', motion)
      const axis = quat.rotateVec3(bat.get('quaternion') as Quat, [0, 1, 0])
      near(point(clip, actual(2900)), vec3.add(bat.get('position') as Vec3, vec3.scale(axis, .51 * batter.actor.who.height / 1.78)))
      expect(clip.result).toMatchObject({ runs: action === 'running' ? 1 : 0, wickets: action === 'run-out' ? 1 : 0 })
      expect(clip.events.find(event => event.id === 'contact')?.time).toBe(actual(2900))
    }
  }, 30000)

  it.each(['batting', 'running', 'catch', 'fielding', 'throw', 'run-out'] as const)('hands the %s fielder from ball attention to travel without a backward snap', action => {
    let reference: number[] | undefined
    for (const [duration, every] of [[6000, 40], [6000, 137], [6000, 1000], [4000, 1000], [60000, 1000]]) {
      const clip = cricketClip({ action, duration, every })
      const motion = new Timeline(clip.timeline)
      const turn = (phase: number) => motion.getStateAtTime(phase * duration / 6000).values.get(`${clip.scene.id}/fielder`)!.get('turn') as number
      const handoff = posed(clip, 'fielder', 3050 * duration / 6000)
      const angle = turn(3050) * Math.PI / 2
      expect(horizontalAlignment(handoff.sample.position, [Math.sin(angle), 0, Math.cos(angle)], point(clip, 3050 * duration / 6000))).toBeGreaterThan(.999)
      expect(Math.abs(turn(3051) - turn(3050)), `${action} ${duration}/${every} handoff`).toBeLessThan(.005)
      for (let time = 3050; time < 3300; time += 10) {
        expect(Math.abs(turn(time + 10) - turn(time)), `${action} ${duration}/${every} ${time}`).toBeLessThan(.12)
      }
      const from = posed(clip, 'fielder', 3250 * duration / 6000), to = posed(clip, 'fielder', 3300 * duration / 6000)
      const travel = turn(3250) * Math.PI / 2
      expect(horizontalAlignment(from.sample.position, [Math.sin(travel), 0, Math.cos(travel)], to.sample.position)).toBeGreaterThan(.999)
      const turns = [3050, 3100, 3200, 3250].map(turn)
      if (reference) turns.forEach((value, index) => expect(value).toBeCloseTo(reference![index], 10))
      else reference = turns
      for (const event of clip.events.filter(event => ['release', 'catch', 'gather', 'throw', 'return'].includes(event.id))) {
        const id = event.id === 'release' ? 'bowler' : event.id === 'return' ? 'keeper' : 'fielder'
        near(point(clip, event.time), posed(clip, id, event.time).palm())
      }
    }
  }, 30000)

  it('keeps the bowler yaw continuous as the run-out return passes behind', () => {
    for (const [duration, every] of [[6000, 40], [6000, 137], [6000, 1000], [4000, 1000], [60000, 1000]]) {
      const clip = cricketClip({ action: 'run-out', duration, every })
      expect(cricketClip({ action: 'run-out', duration, every })).toEqual(clip)
      const track = clip.timeline.tracks.find(track => track.id === 'bowler-turn')!
      if (!('keyframes' in track)) throw new Error('Expected bowler turn keyframes')
      const keys = track.keyframes.filter(key => key.time >= 3500 * duration / 6000)
      for (let index = 1; index < keys.length; index++) {
        expect(Math.abs((keys[index].value as number) - (keys[index - 1].value as number)), `${duration}/${every} ${keys[index].time}`).toBeLessThanOrEqual(2)
      }
      const before = posed(clip, 'bowler', 4900 * duration / 6000), after = posed(clip, 'bowler', 5000 * duration / 6000)
      expect(point(clip, 4900 * duration / 6000)[0]).toBeGreaterThan(before.sample.position[0])
      expect(point(clip, 5000 * duration / 6000)[0]).toBeLessThan(after.sample.position[0])
      expect(Math.abs(after.sample.pose.turn! - before.sample.pose.turn!)).toBeLessThan(2)
      for (const phase of [3500, 4900, 5000, 5100, 6000]) {
        const time = phase * duration / 6000, bowler = posed(clip, 'bowler', time)
        const angle = bowler.sample.pose.turn! * Math.PI / 2
        expect(horizontalAlignment(bowler.sample.position, [Math.sin(angle), 0, Math.cos(angle)], point(clip, time))).toBeGreaterThan(.999)
      }
    }
  }, 30000)
})

describe('cricket camera regressions', () => {
  it.each(Object.keys(CRICKET_VIEWS) as Array<keyof typeof CRICKET_VIEWS>)('magnifies %s without changing the camera path or story', view => {
    const clip = cricketClip({ action: 'six', every: 1000 }), original = JSON.stringify(clip)
    const defaults = cricketCameraTracks(clip, { view, every: 1000 })
    expect(cricketCameraTracks(clip, { view, zoom: 1, every: 1000 })).toEqual(defaults)
    const base = new Timeline({ id: 'base', tracks: defaults })
    for (const zoom of [.25, 2, 4]) {
      const tracks = cricketCameraTracks(clip, { view, zoom, every: 1000 })
      const restored = new Timeline(JSON.parse(JSON.stringify({ id: 'zoomed', tracks })))
      for (const time of [0, 2450, 2900, 6000]) {
        const before = base.getStateAtTime(time).values.get(`${clip.scene.id}/camera`)!
        const after = restored.getStateAtTime(time).values.get(`${clip.scene.id}/camera`)!
        expect(after.get('position')).toEqual(before.get('position'))
        expect(after.get('lookAt')).toEqual(before.get('lookAt'))
        const fov = after.get('fov') as number
        expect(fov).toBeGreaterThan(0); expect(fov).toBeLessThan(180)
        const magnification = Math.tan((before.get('fov') as number) * Math.PI / 360) / Math.tan(fov * Math.PI / 360)
        expect(magnification).toBeCloseTo(zoom, 10)
      }
    }
    expect(JSON.stringify(clip)).toBe(original)
  })
  it('rejects invalid camera zoom values', () => {
    const clip = cricketClip({ every: 1000 })
    for (const zoom of [0, -1, .24, 4.01, NaN, Infinity]) {
      for (const view of ['pitch', 'follow-ball'] as const) expect(() => cricketCameraTracks(clip, { view, zoom })).toThrow('zoom')
    }
  })
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

describe.each(['adults', 'men', 'children', 'mixed'] as CricketCast[])('%s cricket contacts', cast => {
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
      near(batter.palm('left'), grip)
      near(batter.palm('right'), vec3.add(grip, vec3.scale(axis, .105 * scale)), .025)
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
            expect(from[0] + delta[0] * cross).toBeGreaterThan(CRICKET_PITCH.wicketWidth / 2 + ball.geometry.radius)
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
  it.each(['bowling', 'spin', 'no-ball', 'wide', 'stumping'] as const)('clears the native legs along every interpolated %s delivery segment', action => {
    for (const [duration, every] of [[6000, 40], [6000, 137], [6000, 1000], [4000, 1000], [60000, 1000]]) {
      const clip = cricketClip({ action, cast, duration, every }), motion = new Timeline(clip.timeline)
      const ball = clip.scene.objects.find(object => object.id === 'ball')!
      if (ball.kind !== 'mesh' || ball.geometry.type !== 'sphere') throw new Error('Expected spherical ball')
      const caughtAt = clip.events.find(event => event.id === 'keeper')!.time
      const track = clip.timeline.tracks.find(track => track.id === 'ball-x')!
      if (!('keyframes' in track)) throw new Error('Expected ball keyframes')
      const frames = track.keyframes.filter(key => key.time >= 2450 * duration / 6000 && key.time <= caughtAt).map(key => {
        const batter = posed(clip, 'batter', key.time, motion)
        const staged = stagePlanSpace(batter.actor.who.plan, batter.sample.pose, { height: batter.actor.who.height, contact: batter.actor.who.contact })
        const values = state(clip, key.time, 'ball', motion)
        return { time: key.time, batter, legs: staged.chains, ball: vec3.subtract(['x', 'y', 'z'].map(axis => values.get(axis)) as Vec3, batter.sample.position) }
      })
      for (let i = 1; i < frames.length; i++) {
        const start = frames[i - 1], end = frames[i]
        for (const side of ['left', 'right']) for (let bone = 0; bone < 3; bone++) {
          const chain = `leg.${side}`, joints = start.legs[chain]
          near(joints[bone], end.legs[chain][bone], 1e-10)
          near(joints[bone + 1], end.legs[chain][bone + 1], 1e-10)
          const radius = start.batter.actor.who.height * (bone === 2 ? .019 : Math.max(...start.batter.actor.who.body!.leg.map(point => point.width)))
          expect(segmentDistance(start.ball, end.ball, joints[bone], joints[bone + 1]), `${cast} ${action} ${duration}/${every} ${chain}/${bone} ${start.time}-${end.time}`).toBeGreaterThan(ball.geometry.radius + radius)
        }
      }
      near(point(clip, caughtAt), posed(clip, 'keeper', caughtAt, motion).palm())
    }
  }, 30000)
  it('retains intentional LBW contact at the native rear leg', () => {
    for (const duration of [4000, 6000, 60000]) {
      const clip = cricketClip({ action: 'lbw', cast, duration, every: 1000 })
      const time = clip.events.find(event => event.id === 'pad-contact')!.time
      const batter = posed(clip, 'batter', time)
      near(point(clip, time), vec3.lerp(cricketJoint(batter.actor, batter.sample, 'leg.right', 1), cricketJoint(batter.actor, batter.sample, 'leg.right', 2), .6))
      expect(clip.result.dismissal).toBe('lbw')
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
