import { TrackPlayer } from '../../engine/core/track'
import type { Track } from '../../engine/types'
import { cameraFollowTracks, cameraMoveTracks } from '../../scene-3d/shots'
import type { Vec3 } from '../../engine/math'
import { finiteVector } from '../ball-flight'
import { CRICKET_DECISION_VIEWS, cricketFrontFoot, cricketReviewCrease, cricketCameraReview, cricketReviewActor, isCricketDecisionView, type CricketDecisionView } from './cricket-camera-review'
import { cricketChoice, type CricketClip } from './cricket-types'

export type CricketView = 'pitch' | 'batter' | 'bowler' | 'keeper' | 'field' | 'overhead' | 'orbit' | 'follow-ball' | CricketDecisionView
export const CRICKET_VIEWS: Readonly<Record<CricketView, string>> = Object.freeze({ pitch: 'Whole pitch', batter: 'Batter close-up', bowler: 'Bowler close-up', keeper: 'Keeper close-up', field: 'Whole ground', overhead: 'Overhead ground', orbit: '360° ground orbit', 'follow-ball': 'Follow the ball', ...Object.fromEntries(Object.entries(CRICKET_DECISION_VIEWS).map(([view, info]) => [view, info.name])) }) as Readonly<Record<CricketView, string>>
export const CRICKET_CAMERA_ANGLES: Readonly<Record<CricketView, number>> = Object.freeze({ pitch: 75, batter: 145, bowler: 35, keeper: 145, field: 75, overhead: 75, orbit: 75, 'follow-ball': 75, 'front-foot': 90, 'striker-crease': 90, 'bowler-crease': 90 })

export interface CricketCameraOptions {
  view?: CricketView
  /** Fixed-view azimuth, degrees; orbit adds 360°. Follow rotates its default offset relative to 75°. */
  yaw?: number
  /** Optical magnification, 0.25–4; 1 preserves default framing. */
  zoom?: number
  /** Elevation above level, degrees, 0–89, including ball-follow. */
  pitch?: number
  /** Camera-to-target distance in metres, 0.5–2000. */
  distance?: number
  /** Base vertical field of view before optical zoom, degrees, 10–100. */
  fov?: number
  /** Fixed-view target override; not supported by follow-ball. */
  target?: Vec3
  every?: number
}

export interface CricketCameraFraming { target?: Vec3; pitch: number; distance: number; fov: number }

/** Owned preset framing for controls and programmatic stories. Ball-follow has no fixed target. */
export function cricketCameraFraming(clip: CricketClip, selected: CricketView = 'pitch'): CricketCameraFraming {
  const view = cricketChoice(CRICKET_VIEWS, selected, 'cricketCamera.view')
  if (isCricketDecisionView(view)) {
    const crease = cricketReviewCrease(clip, view)
    if (view === 'front-foot') {
      const foot = cricketFrontFoot(clip)
      return { target: [foot.point[0], .12, (foot.point[2] + crease[2]) / 2], pitch: 25, distance: Math.max(2.2, 2.6 * foot.height / 1.78), fov: 40 }
    }
    const wicket = clip.landmarks[view === 'striker-crease' ? 'striker-wicket' : 'bowler-wicket']
    finiteVector(wicket, 'cricketCamera.wicket')
    let centreZ = (crease[2] + wicket[2]) / 2, distance = 4
    if (clip.action === 'run-out' && view === 'bowler-crease' || clip.action === 'running') {
      const event = cricketCameraReview(clip, view)
      if (event) {
        const id = view === 'bowler-crease' ? 'batter' : 'non-striker'
        const runner = cricketReviewActor(clip, id, event.time).sample.position
        centreZ = (Math.min(crease[2], wicket[2], runner[2]) + Math.max(crease[2], wicket[2], runner[2])) / 2
        distance = Math.max(4, Math.abs(wicket[2] - runner[2]) * 1.8)
      }
    }
    let centreX = 0
    if (view === 'striker-crease' && clip.action === 'wide') {
      const event = cricketCameraReview(clip, view)
      if (event) {
        const keeper = cricketReviewActor(clip, 'keeper', event.time).sample.position
        const batter = cricketReviewActor(clip, 'batter', event.time).sample.position
        const minX = Math.min(crease[0], wicket[0], keeper[0], batter[0]), maxX = Math.max(crease[0], wicket[0], keeper[0], batter[0])
        const minZ = Math.min(crease[2], wicket[2], keeper[2], batter[2]), maxZ = Math.max(crease[2], wicket[2], keeper[2], batter[2])
        centreX = (minX + maxX) / 2; centreZ = (minZ + maxZ) / 2
        distance = Math.max(4, Math.hypot(maxX - minX, maxZ - minZ) * 1.8)
      }
    }
    return { target: [centreX, .42, centreZ], pitch: 12, distance, fov: 44 }
  }
  if (view === 'follow-ball') {
    const camera = clip.scene.objects.find(object => object.id === 'camera' && object.kind === 'camera')
    return { pitch: Math.atan2(3, Math.hypot(5, 6)) * 180 / Math.PI, distance: Math.sqrt(70), fov: camera?.kind === 'camera' && camera.projection === 'perspective' ? camera.fov : 48 }
  }
  const wide = view === 'field' || view === 'overhead' || view === 'orbit'
  return {
    target: view === 'batter' ? [.1, .85, 9.3] : view === 'bowler' ? [.68, 1, -9.55] : view === 'keeper' ? [0, .7, 10.1] : [0, .65, 0],
    distance: wide ? clip.boundaryRadius * 2.8 : view === 'pitch' ? 29 : 4.3,
    pitch: view === 'overhead' ? 89 : wide ? 52 : view === 'pitch' ? 16 : 12,
    fov: wide ? 48 : view === 'pitch' ? 50 : 46,
  }
}

function bounded(value: number | undefined, min: number, max: number, name: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value < min || value > max)) throw new Error('cricketCamera: ' + name + ' must be between ' + min + ' and ' + max)
}

/** Public JSON camera tracks; no seeking, playback or motion changes. */
export function cricketCameraTracks(clip: CricketClip, options: CricketCameraOptions = {}): Track[] {
  const view = cricketChoice(CRICKET_VIEWS, options.view ?? 'pitch', 'cricketCamera.view')
  const angle = options.yaw ?? CRICKET_CAMERA_ANGLES[view]
  if (!Number.isFinite(angle)) throw new Error('cricketCamera: yaw must be finite')
  const yaw = ((angle % 360) + 360) % 360
  const zoom = options.zoom ?? 1
  if (!Number.isFinite(zoom) || zoom < .25 || zoom > 4) throw new Error('cricketCamera: zoom must be between 0.25 and 4')
  const magnifiedFov = (fov: number) => zoom === 1 ? fov : Math.atan(Math.tan(fov * Math.PI / 360) / zoom) * 360 / Math.PI
  const every = options.every ?? 40
  if (!Number.isFinite(every) || every < 16 || every > 1000) throw new Error('cricketCamera: every must be between 16 and 1000 ms')
  bounded(options.pitch, 0, 89, 'pitch')
  bounded(options.distance, .5, 2000, 'distance')
  bounded(options.fov, 10, 100, 'fov')
  if (options.target !== undefined) {
    finiteVector(options.target, 'cricketCamera.target')
    if (view === 'follow-ball') throw new Error('cricketCamera: target override is not supported by follow-ball')
  }
  const defaults = cricketCameraFraming(clip, view)
  const pitch = options.pitch ?? defaults.pitch, distance = options.distance ?? defaults.distance
  const fov = magnifiedFov(options.fov ?? defaults.fov)
  const target = options.target ? [...options.target] as Vec3 : defaults.target ?? [0, 0, 0] as Vec3
  const cameraTarget = clip.scene.id + '/camera'
  // Explicit distant/custom framing must not disappear beyond the old far plane.
  const clipping = (tracks: Track[]): Track[] => {
    if (options.distance === undefined && options.target === undefined) return tracks
    const positions = tracks.find(track => track.property === 'position')
    if (!positions || !('keyframes' in positions)) return tracks
    const authored = clip.scene.objects.find(object => object.id === 'camera' && object.kind === 'camera')
    let far = authored?.kind === 'camera' ? Math.max(600, authored.far) : 600
    for (const key of positions.keyframes) far = Math.max(far, Math.hypot(...key.value as Vec3) + clip.boundaryRadius + 10)
    if (!Number.isFinite(far)) throw new Error('cricketCamera: framing exceeds finite camera range')
    return [...tracks, { id: cameraTarget + '-framing-far', target: cameraTarget, property: 'far', keyframes: [{ time: 0, value: far }, { time: clip.duration, value: far }] }]
  }
  if (view === 'follow-ball') {
    const channels = ['x', 'y', 'z'].map(property => {
      const track = clip.timeline.tracks.find(track => track.target === clip.scene.id + '/ball' && track.property === property)
      if (!track || !('keyframes' in track) || !track.keyframes.length) throw new Error('cricketCamera: missing ball ' + property + ' keyframes')
      const keys = track.keyframes
      let index = 0
      let player = new TrackPlayer({ ...track, keyframes: keys.slice(0, 2) })
      return (time: number) => {
        const previous = index
        while (index < keys.length - 2 && time - (track.delay ?? 0) > keys[index + 1].time) index++
        if (index !== previous) player = new TrackPlayer({ ...track, keyframes: keys.slice(index, index + 2) })
        return player.getValueAtTime(time) as number
      }
    })
    const heading = (Math.atan2(5, 6) * 180 / Math.PI + yaw - CRICKET_CAMERA_ANGLES['follow-ball']) * Math.PI / 180
    const elevation = pitch * Math.PI / 180
    const offset: Vec3 = yaw === CRICKET_CAMERA_ANGLES['follow-ball'] && (options.pitch === undefined || options.pitch === defaults.pitch) && (options.distance === undefined || options.distance === defaults.distance) ? [5, 3, 6]
      : [Math.sin(heading) * Math.cos(elevation) * distance, Math.sin(elevation) * distance, Math.cos(heading) * Math.cos(elevation) * distance]
    const tracks = cameraFollowTracks({ scene: clip.scene.id, camera: 'camera', start: 0, end: clip.duration, every, offset, subjectAt: time => channels.map(sample => sample(time)) as Vec3 })
    return clipping([...tracks, { id: cameraTarget + '-zoom-fov', target: cameraTarget, property: 'fov', keyframes: [{ time: 0, value: fov }, { time: clip.duration, value: fov }] }])
  }
  return clipping(cameraMoveTracks({ scene: clip.scene.id, camera: 'camera', start: 0, end: clip.duration, every, easing: 'linear', from: { target, yaw, pitch, distance, fov }, to: { yaw: view === 'orbit' ? yaw + 360 : yaw } }))
}
