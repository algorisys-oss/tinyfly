import type { Keyframe, Track } from '../engine/types'
import type { EasingType } from '../engine/types'
import { getEasingFunction } from '../engine/interpolation/easing'
import { loopNoise } from '../engine/authoring/periodic'
import { orbitPosition } from './camera'
import type { SceneValues } from './resolve-scene'

/**
 * Shots and cameras for a film made from a 3D scene: a shot list as data,
 * cuts and transitions that any frame can be asked about, camera moves as
 * presets that write ordinary tracks, and a seeded handheld shake. Nothing
 * here renders: the tracks join the timeline, and `transitionAt` tells a
 * frame which two cameras to draw and how to blend them.
 *
 *     const shots: Shot[] = [
 *       { id: 'wide', start: 0, end: 4000, camera: 'wide' },
 *       { id: 'close', start: 4000, end: 7000, camera: 'close', transition: { kind: 'crossfade', duration: 600 } },
 *     ]
 *     const tracks = [...shotTracks(shots, 'stage'), ...cameraMoveTracks({ scene: 'stage', camera: 'wide', start: 0, end: 4000,
 *       from: { target: [0, 1, 0], yaw: 20, pitch: 15, distance: 9 }, to: { yaw: 60, distance: 6 } })]
 */

export type Vec3 = [number, number, number]

export interface ShotTransition {
  /** How the shot comes in: a hard cut (the default), a crossfade from the shot before, a dip to black, or a wipe */
  kind: 'cut' | 'crossfade' | 'dipToBlack' | 'wipe'
  /** ms, from the shot's start */
  duration: number
  /** A wipe's direction (default `left`: the new shot sweeps in from the left) */
  direction?: 'left' | 'right' | 'up' | 'down'
  /** A dip's colour (default black) */
  color?: string
}

export interface Shot {
  id: string
  /** ms */
  start: number
  end: number
  /** The camera's object id */
  camera: string
  /** A caption for the storyboard and the stills */
  label?: string
  transition?: ShotTransition
}

/** The shot playing at a time (the last one that has started), or undefined before the first. */
export function shotAt(shots: ReadonlyArray<Shot>, time: number): Shot | undefined {
  let current: Shot | undefined
  for (const shot of [...shots].sort((a, b) => a.start - b.start)) if (shot.start <= time) current = shot
  return current
}

/** Problems with a shot list, as sentences; empty when fine. */
export function checkShots(shots: ReadonlyArray<Shot>): string[] {
  const errors: string[] = []
  const sorted = [...shots].sort((a, b) => a.start - b.start)
  const seen = new Set<string>()
  sorted.forEach((shot, i) => {
    if (seen.has(shot.id)) errors.push(`two shots share the id "${shot.id}"`)
    seen.add(shot.id)
    if (!(shot.end > shot.start)) errors.push(`shot "${shot.id}" ends before it starts`)
    if (i > 0 && shot.start < sorted[i - 1].end) errors.push(`shot "${shot.id}" starts before "${sorted[i - 1].id}" ends`)
    if (shot.transition && i === 0) errors.push(`shot "${shot.id}" is first: nothing to transition from`)
    if (shot.transition && shot.transition.duration > shot.end - shot.start) errors.push(`shot "${shot.id}": its transition is longer than the shot`)
  })
  return errors
}

/**
 * The cut track: `activeCamera` on the scene, one keyframe per shot (a cut
 * is one keyframe; a transition still cuts at the shot's start and blends
 * the shot before over it, see `transitionAt`).
 */
export function shotTracks(shots: ReadonlyArray<Shot>, sceneId: string): Track[] {
  const sorted = [...shots].sort((a, b) => a.start - b.start)
  if (sorted.length === 0) return []
  const keyframes: Keyframe<string>[] = sorted.map((shot) => ({ time: shot.start, value: shot.camera }))
  return [{ id: `${sceneId}-shots`, target: sceneId, property: 'activeCamera', keyframes }]
}

/** One marker per shot, for the timeline's `config.markers` (stills and captions step through them). */
export function shotMarkers(shots: ReadonlyArray<Shot>): Array<{ id: string; time: number; label: string }> {
  return [...shots].sort((a, b) => a.start - b.start).map((shot) => ({ id: shot.id, time: shot.start, label: shot.label ?? shot.id }))
}

export interface ActiveTransition {
  kind: ShotTransition['kind']
  /** 0 at the shot's start to 1 when the transition is over */
  progress: number
  /** The shot going out and the shot coming in */
  from: Shot
  to: Shot
  direction: NonNullable<ShotTransition['direction']>
  color: string
}

/** The transition under way at a time, if one is: which two shots, and how far along. */
export function transitionAt(shots: ReadonlyArray<Shot>, time: number): ActiveTransition | undefined {
  const sorted = [...shots].sort((a, b) => a.start - b.start)
  for (let i = 1; i < sorted.length; i++) {
    const shot = sorted[i]
    const t = shot.transition
    if (!t || t.kind === 'cut' || !(t.duration > 0)) continue
    if (time >= shot.start && time < shot.start + t.duration) {
      return { kind: t.kind, progress: (time - shot.start) / t.duration, from: sorted[i - 1], to: shot, direction: t.direction ?? 'left', color: t.color ?? '#000000' }
    }
  }
  return undefined
}

/**
 * Shots cut on the beat: each shot's start (but the first's) moved to the
 * nearest beat of a grid (`detectTempo` on the music, or `{ bpm, offset }`),
 * ends following; transitions keep their lengths. Nothing moves more than
 * half a beat.
 */
export function snapShotsToBeats(shots: ReadonlyArray<Shot>, grid: { bpm: number; offset: number }): Shot[] {
  const beat = 60000 / grid.bpm
  const nearest = (time: number) => grid.offset + Math.round((time - grid.offset) / beat) * beat
  const sorted = [...shots].sort((a, b) => a.start - b.start).map((shot) => ({ ...shot }))
  for (let i = 1; i < sorted.length; i++) {
    const start = Math.max(sorted[i - 1].start + 1, nearest(sorted[i].start))
    sorted[i - 1].end = start
    sorted[i].start = start
  }
  return sorted
}

/** The scene's values with another camera active: to draw the shot going out during a transition. */
export function withActiveCamera(values: SceneValues | undefined, sceneId: string, cameraId: string): SceneValues {
  const out = new Map(values ?? [])
  const own = new Map(out.get(sceneId) ?? [])
  own.set('activeCamera', cameraId)
  out.set(sceneId, own)
  return out
}

/** Where a camera is and looks, as an orbit round a target (or a fixed position), with its field of view. */
export interface CameraPose {
  /** What it orbits and looks at (default the origin) */
  target?: Vec3
  /** Degrees round the target (0 is in front, +z) */
  yaw?: number
  /** Degrees up from level */
  pitch?: number
  /** Metres from the target */
  distance?: number
  /** A fixed position instead of the orbit (a pan or tilt turns the camera where it stands) */
  position?: Vec3
  /** Where it looks (default the target) */
  lookAt?: Vec3
  /** Vertical field of view, degrees (a zoom changes it) */
  fov?: number
}

export interface CameraMoveOptions {
  scene: string
  camera: string
  /** ms */
  start: number
  end: number
  /** Where the move starts and ends: `to` fills in from `from` */
  from: CameraPose
  to: Partial<CameraPose>
  /** Easing over the move (default `ease-in-out`) */
  easing?: EasingType
  /** Key spacing, ms (default 33): the path between keys is a straight line */
  every?: number
}

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** A camera pose at a point of a move, `t` 0..1 (eased already). */
export function cameraPoseAt(from: CameraPose, to: Partial<CameraPose>, t: number): { position: Vec3; lookAt: Vec3; fov?: number } {
  const a = { target: [0, 0, 0] as Vec3, yaw: 0, pitch: 15, distance: 8, ...from }
  const b = { ...a, ...to }
  const target = lerp3(a.target, b.target, t)
  const position =
    a.position || b.position
      ? lerp3(a.position ?? orbitPosition(a.target, a.yaw, a.pitch, a.distance), b.position ?? orbitPosition(b.target, b.yaw, b.pitch, b.distance), t)
      : orbitPosition(target, a.yaw + (b.yaw - a.yaw) * t, a.pitch + (b.pitch - a.pitch) * t, a.distance + (b.distance - a.distance) * t)
  const lookAt = lerp3(a.lookAt ?? a.target, b.lookAt ?? b.target, t)
  const fov = a.fov !== undefined || b.fov !== undefined ? (a.fov ?? b.fov!) + ((b.fov ?? a.fov!) - (a.fov ?? b.fov!)) * t : undefined
  return { position, lookAt, fov }
}

/**
 * A camera move as tracks on the camera (`position`, `lookAt`, and `fov`
 * when it zooms): an orbit (change `yaw`), a dolly (`distance`), a crane
 * (`pitch` and `distance`), a pan or tilt (`position` fixed, `lookAt`
 * moving), a zoom (`fov`), or any mix, eased over the move.
 */
export function cameraMoveTracks(options: CameraMoveOptions): Track[] {
  const every = Math.max(1, options.every ?? 33)
  const ease = getEasingFunction(options.easing ?? 'ease-in-out')
  const target = `${options.scene}/${options.camera}`
  const position: Keyframe<number[]>[] = []
  const lookAt: Keyframe<number[]>[] = []
  const fov: Keyframe<number>[] = []
  for (let time = options.start; ; time = Math.min(options.end, time + every)) {
    const u = options.end > options.start ? ease((time - options.start) / (options.end - options.start)) : 1
    const pose = cameraPoseAt(options.from, options.to, u)
    position.push({ time, value: pose.position })
    lookAt.push({ time, value: pose.lookAt })
    if (pose.fov !== undefined) fov.push({ time, value: pose.fov })
    if (time >= options.end) break
  }
  const tracks: Track[] = [
    { id: `${target}-move-position`, target, property: 'position', keyframes: position },
    { id: `${target}-move-lookAt`, target, property: 'lookAt', keyframes: lookAt },
  ]
  if (fov.length > 0) tracks.push({ id: `${target}-move-fov`, target, property: 'fov', keyframes: fov })
  return tracks
}

export interface CameraFollowOptions {
  scene: string
  camera: string
  start: number
  end: number
  /** Where the subject is at a time (its position in the scene) */
  subjectAt: (time: number) => Vec3
  /** The camera's place relative to the subject, metres (default behind and above: [0, 2, 6]) */
  offset?: Vec3
  /** How far the camera lags behind the subject's motion, ms (default 0) */
  lag?: number
  every?: number
}

/** Tracks that keep a camera on a moving subject: its position an offset from the subject, looking at it. */
export function cameraFollowTracks(options: CameraFollowOptions): Track[] {
  const every = Math.max(1, options.every ?? 33)
  const offset = options.offset ?? [0, 2, 6]
  const lag = options.lag ?? 0
  const target = `${options.scene}/${options.camera}`
  const position: Keyframe<number[]>[] = []
  const lookAt: Keyframe<number[]>[] = []
  for (let time = options.start; ; time = Math.min(options.end, time + every)) {
    const subject = options.subjectAt(time)
    const behind = options.subjectAt(Math.max(options.start, time - lag))
    position.push({ time, value: [behind[0] + offset[0], behind[1] + offset[1], behind[2] + offset[2]] })
    lookAt.push({ time, value: subject })
    if (time >= options.end) break
  }
  return [
    { id: `${target}-follow-position`, target, property: 'position', keyframes: position },
    { id: `${target}-follow-lookAt`, target, property: 'lookAt', keyframes: lookAt },
  ]
}

export interface HandheldOptions {
  scene: string
  camera: string
  start: number
  end: number
  /** How far the camera drifts, metres (default 0.04), and how far its aim wanders, metres at the subject (default 0.08) */
  amount?: number
  aim?: number
  /** How quickly it wanders (default 1.2 wobbles a second) */
  rate?: number
  seed?: number | string
  /** The camera's rest, when no move's tracks are given: its authored position and where it looks */
  base?: { position: Vec3; lookAt: Vec3 }
  every?: number
}

/**
 * A deterministic handheld shake: seeded, smooth, and added onto a move's
 * `position` and `lookAt` tracks (or a still camera's `base`). The same
 * seed always shakes the same way.
 */
export function cameraHandheldTracks(tracks: ReadonlyArray<Track>, options: HandheldOptions): Track[] {
  const target = `${options.scene}/${options.camera}`
  const amount = options.amount ?? 0.04
  const aim = options.aim ?? 0.08
  const rate = options.rate ?? 1.2
  const every = Math.max(1, options.every ?? 33)
  const span = options.end - options.start
  const period = Math.max(1, span)
  const cycles = Math.max(1, Math.round((period / 1000) * rate))
  const seed = typeof options.seed === 'string' ? options.seed : `handheld-${options.seed ?? 0}`
  const noise = (time: number, axis: string) => loopNoise(time - options.start, { period, seed: `${seed}-${axis}`, cycles, octaves: 2 })
  const own = tracks.filter((track) => track.target === target)
  const others = tracks.filter((track) => track.target !== target)
  const shaken = (property: 'position' | 'lookAt', scale: number, fallback: Vec3 | undefined): Track | undefined => {
    const existing = own.find((track) => track.property === property)
    const keys: Keyframe<number[]>[] = []
    if (existing) {
      for (const key of existing.keyframes) {
        const v = key.value as number[]
        keys.push({ time: key.time, value: [v[0] + noise(key.time, `${property}x`) * scale, v[1] + noise(key.time, `${property}y`) * scale, v[2] + noise(key.time, `${property}z`) * scale * 0.5], easing: key.easing })
      }
    } else if (fallback) {
      for (let time = options.start; ; time = Math.min(options.end, time + every)) {
        keys.push({ time, value: [fallback[0] + noise(time, `${property}x`) * scale, fallback[1] + noise(time, `${property}y`) * scale, fallback[2] + noise(time, `${property}z`) * scale * 0.5] })
        if (time >= options.end) break
      }
    } else return undefined
    return { id: existing?.id ?? `${target}-handheld-${property}`, target, property, keyframes: keys }
  }
  const out = [...others, ...own.filter((track) => track.property !== 'position' && track.property !== 'lookAt')]
  const position = shaken('position', amount, options.base?.position)
  const lookAt = shaken('lookAt', aim, options.base?.lookAt)
  if (position) out.push(position)
  if (lookAt) out.push(lookAt)
  return out
}
