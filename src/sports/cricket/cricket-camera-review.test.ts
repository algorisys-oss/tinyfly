import { describe, expect, it } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { vec3, mat4, type Vec3 } from '../../engine/math'
import { characterObjects } from '../../characters/scene-objects'
import { loadScene3D } from '../../scene-3d/load-scene'
import { resolveScene3D } from '../../scene-3d/resolve-scene'
import { validateScene3D } from '../../scene-3d/validate-scene'
import { cricketClip, cricketPlayClip, cricketCameraTracks, cricketCameraFraming, cricketCameraReview, cricketDecisionOverlay, CRICKET_DECISION_VIEWS, type CricketCast } from './index'
import { cricketFrontFoot, cricketReviewActor } from './cricket-camera-review'

const cameraState = (clip: ReturnType<typeof cricketClip>, options: Parameters<typeof cricketCameraTracks>[1], time = 1900) =>
  new Timeline({ id: 'camera', tracks: cricketCameraTracks(clip, { every: 1000, ...options }) }).getStateAtTime(time).values.get(clip.scene.id + '/camera')!

describe('cricket decision cameras', () => {
  it.each(['adults', 'men', 'children', 'mixed'] as CricketCast[])('anchors %s legal and no-ball release feet while retaining the crease reference', cast => {
    for (const legality of ['legal', 'no-ball'] as const) for (const duration of [4000, 12000]) {
      const clip = cricketPlayClip({ cast, duration, every: 1000, delivery: { legality }, finish: 'stumps', decision: { dismissal: 'bowled' } })
      const original = JSON.stringify(clip), foot = cricketFrontFoot(clip)
      const framing = cricketCameraFraming(clip, 'front-foot')
      expect(framing.target![0]).toBe(foot.point[0])
      expect(framing.target![2]).toBe((foot.point[2] - 8.84) / 2)
      expect(cricketCameraReview(clip, 'front-foot')!.time).toBe(1900 * duration / 6000)
      const tracks = cricketCameraTracks(clip, { view: 'front-foot', every: 137 })
      expect(validateScene3D(clip.scene, tracks)).toEqual([])
      const camera = new Timeline({ id: 'camera', tracks })
      const start = camera.getStateAtTime(0).values.get(clip.scene.id + '/camera')!
      expect(start.get('lookAt')).toEqual(framing.target)
      expect(camera.getStateAtTime(clip.duration).values.get(clip.scene.id + '/camera')!.get('position')).toEqual(start.get('position'))
      expect(JSON.stringify(clip)).toBe(original)
    }
  }, 15000)
  it.each(['adults', 'men', 'children', 'mixed'] as CricketCast[])('frames the %s approaching runner and wicket together at run-out', cast => {
    const clip = cricketClip({ cast, action: 'run-out', every: 1000 })
    const motion = new Timeline(clip.timeline), state = motion.getStateAtTime(5000).values
    state.set(clip.scene.id + '/camera', cameraState(clip, { view: 'bowler-crease' }, 5000))
    const frame = resolveScene3D(loadScene3D(clip.scene, { kinds: [characterObjects] }), state, { width: 1280, height: 720 })
    const projected = mat4.multiply(frame.camera.projection, frame.camera.view)
    const runner = cricketReviewActor(clip, 'batter', 5000).sample.position
    for (const point of [runner, [runner[0], 1.8, runner[2]] as Vec3, clip.landmarks['bowler-wicket'], clip.landmarks['bowler-crease']]) {
      const ndc = mat4.transformPoint(projected, point)
      expect(Math.abs(ndc[0])).toBeLessThan(.9)
      expect(Math.abs(ndc[1])).toBeLessThan(.9)
    }
  })
  it.each(['adults', 'men', 'children', 'mixed'] as CricketCast[])('contains the %s Wide keeper, batter and crease at scaled collection events', cast => {
    for (const duration of [4000, 6000, 12000]) for (const composed of [false, true]) {
      const clip = composed
        ? cricketPlayClip({ cast, duration, every: 1000, delivery: { legality: 'wide' }, context: { freeHit: true } })
        : cricketClip({ cast, duration, every: 1000, action: 'wide' })
      const original = JSON.stringify(clip), moment = cricketCameraReview(clip, 'striker-crease')!
      expect(moment.time).toBe(3500 * duration / 6000)
      const state = new Timeline(clip.timeline).getStateAtTime(moment.time).values
      state.set(clip.scene.id + '/camera', cameraState(clip, { view: 'striker-crease' }, moment.time))
      const frame = resolveScene3D(loadScene3D(clip.scene, { kinds: [characterObjects] }), state, { width: 1280, height: 720 })
      const projected = mat4.multiply(frame.camera.projection, frame.camera.view)
      for (const id of ['keeper', 'batter']) {
        const { sample, actor } = cricketReviewActor(clip, id, moment.time)
        for (const point of [sample.position, [sample.position[0], actor.who.height, sample.position[2]] as Vec3]) {
          const ndc = mat4.transformPoint(projected, point)
          expect(Math.abs(ndc[0])).toBeLessThan(.9)
          expect(Math.abs(ndc[1])).toBeLessThan(.9)
        }
      }
      for (const id of ['striker-crease', 'striker-wicket']) expect(Math.abs(mat4.transformPoint(projected, clip.landmarks[id])[0])).toBeLessThan(.9)
      expect(JSON.stringify(clip)).toBe(original)
    }
  }, 15000)
  it('selects physical events independently of protected decisions', () => {
    const noBall = cricketPlayClip({ delivery: { legality: 'no-ball' }, finish: 'stumps', decision: { dismissal: 'bowled' }, every: 1000 })
    expect(cricketCameraReview(noBall, 'striker-crease')).toMatchObject({ id: 'wicket', time: 3200 })
    expect(noBall.result.wickets).toBe(0)
    expect(cricketCameraReview(cricketClip({ action: 'stumping', every: 1000 }), 'striker-crease')!.time).toBe(3900)
    expect(cricketCameraReview(cricketClip({ action: 'run-out', every: 1000 }), 'bowler-crease')!.time).toBe(5000)
    expect(cricketCameraReview(cricketClip({ action: 'running', every: 1000 }), 'striker-crease')!.time).toBe(5500)
    expect(cricketCameraReview(noBall, 'pitch')).toBeUndefined()
    const event = cricketCameraReview(noBall, 'front-foot')!
    event.caption = 'changed'
    expect(noBall.events.find(e => e.id === 'release')!.caption).not.toBe('changed')
  })
  it.each([4000, 6000, 12000])('selects the keeper return for stock and composed throws lasting %s ms', duration => {
    const clips = [
      cricketClip({ action: 'throw', duration, every: 1000 }),
      cricketPlayClip({ shot: 'drive', fielding: 'throw', duration, every: 1000 }),
    ]
    for (const clip of clips) {
      expect(cricketCameraReview(clip, 'striker-crease')).toMatchObject({ id: 'return', kind: 'collect', time: 5300 * duration / 6000 })
      expect(cricketCameraReview({ ...clip, events: clip.events.filter(event => event.id !== 'return') }, 'striker-crease')).toMatchObject({ id: 'contact', time: 2900 * duration / 6000 })
    }
  })
  it('creates owned optional reference overlays for the correct end without changing the motion', () => {
    const clip = cricketClip({ action: 'run-out', every: 1000 }), original = JSON.stringify(clip)
    for (const view of Object.keys(CRICKET_DECISION_VIEWS)) {
      const overlay = cricketDecisionOverlay(clip, view)
      expect(overlay).toHaveLength(1)
      expect(validateScene3D({ ...clip.scene, objects: [...clip.scene.objects, ...overlay] })).toEqual([])
      if (overlay[0].kind !== 'line') throw new Error('Expected reference line')
      expect(overlay[0].points.every(point => point[2] === (view === 'striker-crease' ? 8.84 : -8.84))).toBe(true)
      overlay[0].points[0][0] = 99
      const fresh = cricketDecisionOverlay(clip, view)[0]
      expect(fresh.kind === 'line' && fresh.points[0][0]).not.toBe(99)
    }
    expect(cricketDecisionOverlay(clip, 'pitch')).toEqual([])
    expect(JSON.stringify(clip)).toBe(original)
  })
  it('configures target, elevation, distance and base lens, retaining optical zoom and clipping', () => {
    const clip = cricketClip({ every: 1000 })
    const state = cameraState(clip, { view: 'striker-crease', target: [0, .3, 10], pitch: 30, distance: 2000, fov: 60, zoom: 2 })
    expect(state.get('lookAt')).toEqual([0, .3, 10])
    expect(vec3.distance(state.get('position') as Vec3, state.get('lookAt') as Vec3)).toBeCloseTo(2000, 10)
    expect(Math.tan((state.get('fov') as number) * Math.PI / 360)).toBeCloseTo(Math.tan(Math.PI / 6) / 2, 10)
    expect(state.get('far')).toBeGreaterThan(vec3.length(state.get('position') as Vec3) + clip.boundaryRadius)
    const frame = resolveScene3D(loadScene3D(clip.scene, { kinds: [characterObjects] }), new Map([[clip.scene.id + '/camera', state]]), { width: 1280, height: 720 })
    expect(frame.camera.far).toBe(state.get('far'))
  })
  it('rotates and elevates follow-ball offsets without changing the tracked ball', () => {
    const clip = cricketClip({ action: 'six', every: 1000 })
    const base = cameraState(clip, { view: 'follow-ball' })
    const rotated = cameraState(clip, { view: 'follow-ball', yaw: 165, pitch: 40, distance: 12 })
    expect(rotated.get('lookAt')).toEqual(base.get('lookAt'))
    const offset = vec3.subtract(rotated.get('position') as Vec3, rotated.get('lookAt') as Vec3)
    expect(vec3.length(offset)).toBeCloseTo(12, 10)
    expect(Math.asin(offset[1] / 12) * 180 / Math.PI).toBeCloseTo(40, 10)
    expect(rotated.get('position')).not.toEqual(base.get('position'))
    expect(cricketCameraTracks(clip, { view: 'follow-ball', yaw: 0 })).toEqual(cricketCameraTracks(clip, { view: 'follow-ball', yaw: 360 }))
  })
  it('can spread follow framing defaults into camera options without a false fixed target or drift', () => {
    const clip = cricketClip({ every: 1000 })
    const defaults = cricketCameraFraming(clip, 'follow-ball')
    expect(defaults.target).toBeUndefined()
    const before = cameraState(clip, { view: 'follow-ball' }), after = cameraState(clip, { view: 'follow-ball', ...defaults })
    for (const property of ['position', 'lookAt', 'fov']) expect(after.get(property)).toEqual(before.get(property))
  })
  it('owns framing data and rejects invalid camera input or missing review landmarks/events', () => {
    const clip = cricketClip({ every: 1000 })
    const framing = cricketCameraFraming(clip)
    framing.target![0] = 100
    expect(cricketCameraFraming(clip).target![0]).toBe(0)
    for (const options of [{ pitch: -1 }, { pitch: 90 }, { pitch: NaN }, { distance: 0 }, { distance: 2001 }, { fov: 9 }, { fov: Infinity }, { target: [NaN, 0, 0] as Vec3 }, { view: 'follow-ball' as const, target: [0, 0, 0] as Vec3 }]) expect(() => cricketCameraTracks(clip, options)).toThrow()
    expect(() => cricketCameraFraming({ ...clip, events: [] }, 'front-foot')).toThrow('release')
    expect(() => cricketCameraFraming({ ...clip, landmarks: {} }, 'striker-crease')).toThrow()
  })
})
