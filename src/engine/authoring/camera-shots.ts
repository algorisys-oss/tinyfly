import type { EasingType, Keyframe, Track } from '../types'
import { Timeline } from '../core/timeline'
import { createRandom } from './random'

/**
 * Camera acting: a list of shots in, camera tracks out.
 *
 * Shots say what the camera does and when: frame a point (push in, pull
 * out, or cut when the move takes no time), shake on an impact, or follow a
 * moving subject a beat behind it. The result is ordinary keyframe tracks on
 * the camera target (`x`, `y`, `scale`, `rotate`, and `shakeX`, `shakeY`,
 * `shakeRotate` for shakes), the same JSON as any other animation, which
 * `applyCamera` (canvas) or the editor's camera layer turn into a view.
 */

/** Frame a point: the camera moves so `focus` is at the centre of the picture, at `scale`. */
export interface FrameShot {
  at: number
  /** How long the move takes, ms (0 cuts; default 600) */
  duration?: number
  easing?: EasingType
  frame: {
    /** The scene point to centre (default: the stage centre) */
    focus?: { x: number; y: number }
    /** Zoom (default 1) */
    scale?: number
    /** Roll, degrees (default 0) */
    rotate?: number
  }
}

/** Shake the picture: an impact, a stomp, a scream. It dies away over `duration`. */
export interface ShakeShot {
  at: number
  duration: number
  shake: {
    /** How far, px, at the start (default 12) */
    strength?: number
    /** Jolts per second (default 24) */
    frequency?: number
    /** Roll in the shake, degrees at the start (default 1.5) */
    roll?: number
    seed?: number
  }
}

/** Follow a subject across: the camera keeps it centred, `lag` ms behind it. */
export interface FollowShot {
  at: number
  /** When the camera stops following and holds, ms */
  until: number
  follow: {
    /** The subject's scene x over time: its x track's keyframes */
    x: Keyframe<number>[]
    /** Added to the subject's x: frame ahead of a runner (default 0) */
    lead?: number
    /** Scene y to keep centred (default: keeps the current framing's) */
    y?: number
    /** How far behind the subject the camera is, ms (default 250) */
    lag?: number
    /** Zoom while following (default: the current one) */
    scale?: number
  }
}

export type CameraShot = FrameShot | ShakeShot | FollowShot

export interface CameraTrackOptions {
  /** The stage size: framing centres on its middle */
  stage: { width: number; height: number }
  /** The camera's target name (default `Camera`) */
  target?: string
}

/** What the camera centres, and how close: the framing between shots. */
interface Framing {
  focusX: number
  focusY: number
  scale: number
  rotate: number
}

const DEFAULT_MOVE = 600
const DEFAULT_LAG = 250
/** A cut is a move this short (ms): the next frame is the new shot. */
const CUT = 1

/** Camera tracks for a list of shots (any order; they are played in time order). */
export function cameraTracks(shots: CameraShot[], options: CameraTrackOptions): Track[] {
  const target = options.target ?? 'Camera'
  const centre = { x: options.stage.width / 2, y: options.stage.height / 2 }
  const keys: Record<string, Keyframe<number>[]> = {}
  /** Add a key; a key at or before the last one replaces it (the later shot wins). */
  const key = (property: string, time: number, value: number, easing?: EasingType) => {
    const list = (keys[property] ??= [])
    while (list.length > 0 && list[list.length - 1].time >= time) list.pop()
    list.push({ time, value, ...(easing ? { easing } : {}) })
  }
  /** The camera's x/y/scale/rotate for a framing: the focus lands on the centre. */
  const view = (framing: Framing) => {
    const angle = (framing.rotate * Math.PI) / 180
    const dx = (framing.focusX - centre.x) * framing.scale
    const dy = (framing.focusY - centre.y) * framing.scale
    return {
      x: -(dx * Math.cos(angle) - dy * Math.sin(angle)),
      y: -(dx * Math.sin(angle) + dy * Math.cos(angle)),
      scale: framing.scale,
      rotate: framing.rotate,
    }
  }
  const place = (time: number, framing: Framing, easing?: EasingType) => {
    const v = view(framing)
    for (const property of ['x', 'y', 'scale', 'rotate'] as const) key(property, time, v[property], easing)
  }

  let framing: Framing = { focusX: centre.x, focusY: centre.y, scale: 1, rotate: 0 }
  const ordered = [...shots].sort((a, b) => a.at - b.at)
  const framed = ordered.filter((shot): shot is FrameShot | FollowShot => !('shake' in shot))
  if (framed.length > 0) place(0, framing)

  for (const shot of framed) {
    if ('frame' in shot) {
      const duration = Math.max(CUT, shot.duration ?? DEFAULT_MOVE)
      place(shot.at, framing)
      framing = {
        focusX: shot.frame.focus?.x ?? centre.x,
        focusY: shot.frame.focus?.y ?? centre.y,
        scale: shot.frame.scale ?? 1,
        rotate: shot.frame.rotate ?? 0,
      }
      place(shot.at + duration, framing, shot.easing ?? (duration > CUT ? 'ease-in-out' : undefined))
    } else {
      // Follow: the subject's position at each of its keys, a lag later.
      const { follow } = shot
      const lag = follow.lag ?? DEFAULT_LAG
      const subject = new Timeline({ id: 'follow', tracks: [{ id: 'x', target: 's', property: 'x', keyframes: follow.x }] })
      const xAt = (time: number) => (subject.getStateAtTime(time).values.get('s')?.get('x') as number | undefined) ?? framing.focusX
      const times = [shot.at, ...follow.x.map((frame) => frame.time).filter((time) => time > shot.at && time < shot.until), shot.until]
      place(shot.at, framing)
      const following = (time: number): Framing => ({
        focusX: xAt(time) + (follow.lead ?? 0),
        focusY: follow.y ?? framing.focusY,
        scale: follow.scale ?? framing.scale,
        rotate: framing.rotate,
      })
      for (const time of times) {
        const easing = follow.x.find((frame) => frame.time === time)?.easing
        place(time + lag, following(time), time === shot.at ? 'ease-in-out' : easing)
      }
      framing = following(shot.until)
    }
  }

  for (const shot of ordered.filter((shot): shot is ShakeShot => 'shake' in shot)) {
    const strength = shot.shake.strength ?? 12
    const roll = shot.shake.roll ?? 1.5
    const step = 1000 / (shot.shake.frequency ?? 24)
    const random = createRandom(shot.shake.seed ?? Math.round(shot.at) + 1)
    const jolt = () => random.next() * 2 - 1
    for (const property of ['shakeX', 'shakeY', 'shakeRotate']) key(property, shot.at, 0)
    for (let time = shot.at + step; time < shot.at + shot.duration; time += step) {
      // Strongest at the impact, dying away to nothing.
      const left = 1 - (time - shot.at) / shot.duration
      key('shakeX', time, jolt() * strength * left)
      key('shakeY', time, jolt() * strength * left)
      key('shakeRotate', time, jolt() * roll * left)
    }
    for (const property of ['shakeX', 'shakeY', 'shakeRotate']) key(property, shot.at + shot.duration, 0, 'ease-out')
  }

  return Object.entries(keys).map(([property, keyframes]) => ({ id: `${target}-${property}`, target, property, keyframes }))
}
