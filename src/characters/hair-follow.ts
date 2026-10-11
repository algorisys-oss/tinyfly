import type { Keyframe, Track } from '../engine/types'
import { Timeline } from '../engine/core/timeline'
import { springFollow } from '../engine/authoring/spring-follow'
import type { Pose } from './rig/body-plan'
import { characterJoints, type Character } from './character'
import { HUMAN_REST } from './species/human'
import { hairHangs } from './head/hair'

/**
 * Hair follow-through: hanging hair (long hair, ponytails, braids) lags
 * behind the head, swinging round it after a turn, streaming back on a run,
 * dropping on a jump and lifting on the landing. The drawing stays stateless:
 * the lag is three pose fields (`hair.swing`, `hair.trail`, `hair.lift`), and
 * this module works them out ahead of time from the head's motion, the way
 * `Prop.follow` does for a car's antenna or a dog's tail.
 *
 *     // Timelines: add the hair's tracks after the character's own.
 *     const tracks = characterPoseTracks('amy', keys)
 *     tracks.push(...hairFollowTracks('amy', tracks, amy))
 *
 *     // Code that poses a character every frame: key the lag once for the
 *     // loop, then read it at each frame's time.
 *     const keys = hairFollow((t) => ({ x: xAt(t), y: 0, turn: turnAt(t) }), { end: 8000, headRadius: 24 })
 *     drawCharacter(ctx, amy, humanPose({ turn: turnAt(t), ...hairMotionAt(keys, t) }), t)
 *
 * Each lag chases its primary on a spring stepped in fixed 1 ms steps
 * (`springFollow`), so the same motion always gives the same keys.
 */

/** Where the head is at a time: screen x and y (px) and the body's view (`turn`), plus the head's own turn (degrees). */
export interface HairFollowSample {
  x: number
  y: number
  /** The pose's `turn` (0 front, 1 profile facing screen-right, 2 back…) */
  turn: number
  /** The pose's `head.turn`, degrees toward the character's left (default 0) */
  headTurn?: number
}

export interface HairFollowOptions {
  /** From and to, ms (start defaults to 0) */
  start?: number
  end: number
  /** The head's radius on screen, px: the lag is measured in head radii */
  headRadius: number
  /** Key spacing, ms (default 33) */
  step?: number
  /** Spring stiffness (default 70): higher follows the head more tightly */
  stiffness?: number
  /** Damping (default 6): lower swings longer */
  damping?: number
  /** How much the hair lags, 1 the default feel; 0 pins it to the head */
  amount?: number
}

/** The hair's lag at one time. */
export interface HairFollowKey {
  time: number
  /** `hair.swing`: round the head toward the character's left (+), degrees */
  swing: number
  /** `hair.trail`: streaming back behind the head (+), head radii */
  trail: number
  /** `hair.lift`: lifted (+) or dropped (−), head radii */
  lift: number
}

/** The most the ends swing round, degrees; stream back, head radii; and lift or drop, head radii. */
const SWING_LIMIT = 50
const TRAIL_LIMIT = 1.2
const LIFT_LIMIT = 0.8

/**
 * How a lag turns into a motion: the ends of hanging hair whip further than
 * the head moves. Degrees of swing per degree of turn lagged, and per head
 * radius lagged sideways; head radii of trail per head radius lagged back; and
 * of lift per head radius lagged up.
 */
const SWING_PER_DEGREE = 3
const SWING_PER_RADIUS_ACROSS = 30
const TRAIL_PER_RADIUS = 0.8
const LIFT_PER_RADIUS = 0.6

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))

/** The pose fields a key sets. */
const HAIR_FIELDS = ['hair.swing', 'hair.trail', 'hair.lift'] as const

/**
 * Key the hair's lag over a span, from where the head is at each moment.
 * Returns a key every `step` ms from `start` to `end`.
 */
export function hairFollow(sample: (time: number) => HairFollowSample, options: HairFollowOptions): HairFollowKey[] {
  const start = options.start ?? 0
  const amount = options.amount ?? 1
  const radius = Math.max(1e-6, options.headRadius)
  // The three springs step through the same milliseconds: sample the head once per millisecond.
  let lastTime = NaN
  let last: HairFollowSample = { x: 0, y: 0, turn: 0 }
  const at = (time: number) => {
    if (time !== lastTime) {
      last = sample(time)
      lastTime = time
    }
    return last
  }
  const headDegrees = (time: number) => {
    const s = at(time)
    return s.turn * 90 + (s.headTurn ?? 0)
  }
  const spring = { start, end: options.end, step: options.step, stiffness: options.stiffness ?? 70, damping: options.damping ?? 6 }
  const chaseTurn = springFollow(headDegrees, spring)
  const chaseX = springFollow((t) => at(t).x, spring)
  const chaseY = springFollow((t) => at(t).y, spring)
  return chaseTurn.map((key, i) => {
    const s = at(key.time)
    const turnLag = key.value - headDegrees(key.time)
    const xLag = chaseX[i].value - s.x
    const yLag = chaseY[i].value - s.y
    // Which way the character faces on screen (1 right, −1 left), and how much it faces the viewer or away (±1).
    const facing = Math.sin((s.turn * Math.PI) / 2)
    const across = Math.cos((s.turn * Math.PI) / 2)
    // Hair where the head was: a lag toward screen-right is toward the character's left when it faces the viewer.
    const swing = turnLag * SWING_PER_DEGREE + ((xLag * across) / radius) * SWING_PER_RADIUS_ACROSS
    // A lag behind the way it faces streams the hair back; a lag below (screen y grows downward) drops it.
    const trail = ((-xLag * facing) / radius) * TRAIL_PER_RADIUS
    const lift = (-yLag / radius) * LIFT_PER_RADIUS
    return {
      time: key.time,
      swing: clamp(swing * amount, SWING_LIMIT),
      trail: clamp(trail * amount, TRAIL_LIMIT),
      lift: clamp(lift * amount, LIFT_LIMIT),
    }
  })
}

/** The hair's lag at a time, between keys, as the pose fields it sets (`hair.swing`, `hair.trail`, `hair.lift`). */
export function hairMotionAt(keys: HairFollowKey[], time: number): Pose {
  if (keys.length === 0) return { 'hair.swing': 0, 'hair.trail': 0, 'hair.lift': 0 }
  if (time <= keys[0].time) return fields(keys[0])
  if (time >= keys[keys.length - 1].time) return fields(keys[keys.length - 1])
  let low = 0
  let high = keys.length - 1
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (keys[mid].time <= time) low = mid
    else high = mid
  }
  const a = keys[low]
  const b = keys[high]
  const t = b.time === a.time ? 0 : (time - a.time) / (b.time - a.time)
  return {
    'hair.swing': a.swing + (b.swing - a.swing) * t,
    'hair.trail': a.trail + (b.trail - a.trail) * t,
    'hair.lift': a.lift + (b.lift - a.lift) * t,
  }
}

const fields = (key: HairFollowKey): Pose => ({ 'hair.swing': key.swing, 'hair.trail': key.trail, 'hair.lift': key.lift })

export interface HairFollowTrackOptions extends Pick<HairFollowOptions, 'step' | 'stiffness' | 'damping' | 'amount'> {
  /** How long the hair keeps settling after the last key, ms (default 1500) */
  settle?: number
}

/** How long follow-through keeps moving after the last key, ms. */
const FOLLOW_SETTLE = 1500

/**
 * Tracks that key a character target's hair lag from its own tracks: the
 * target's `x` and `y`, and the pose's `turn` and `head.turn`. Nothing is
 * added for hair that has nothing to swing (short hair, a bun, no hair).
 * Hair fields the tracks already key (a flick written by hand) keep their
 * values, with the lag added on.
 */
export function hairFollowTracks(target: string, tracks: Track[], who: Character, options: HairFollowTrackOptions = {}): Track[] {
  const hair = who.head.hair
  if (!hair || !hairHangs(hair)) return []
  const own = tracks.filter((track) => track.target === target)
  const duration = own.reduce((end, track) => track.keyframes.reduce((e, key) => Math.max(e, key.time), end), 0)
  const followed = new Set(['x', 'y', 'turn', 'head.turn'])
  const sampler = new Timeline({ id: `${target}-hair-follow`, tracks: own.filter((track) => followed.has(track.property)) })
  const rest = HUMAN_REST
  const valueOf = (time: number, property: string, fallback: number) => {
    const value = sampler.getStateAtTime(time).values.get(target)?.get(property)
    return typeof value === 'number' ? value : fallback
  }
  const keys = hairFollow(
    (time) => ({
      x: valueOf(time, 'x', 0),
      y: valueOf(time, 'y', 0),
      turn: valueOf(time, 'turn', rest.turn ?? 0),
      headTurn: valueOf(time, 'head.turn', rest['head.turn'] ?? 0),
    }),
    {
      start: 0,
      end: duration + (options.settle ?? FOLLOW_SETTLE),
      headRadius: characterJoints(who, HUMAN_REST).head.rx,
      step: options.step,
      stiffness: options.stiffness,
      damping: options.damping,
      amount: options.amount,
    }
  )
  const out: Track[] = []
  for (const field of HAIR_FIELDS) {
    const name = field.slice('hair.'.length) as 'swing' | 'trail' | 'lift'
    let keyframes: Keyframe<number>[] = keys.map((key) => ({ time: key.time, value: key[name] }))
    if (keyframes.every((key) => Math.abs(key.value) < 1e-3)) continue
    const written = own.find((track) => track.property === field)
    if (written) {
      // Add the lag onto what was keyed by hand.
      const hand = new Timeline({ id: `${target}-${field}-own`, tracks: [written] })
      const handAt = (time: number) => Number(hand.getStateAtTime(time).values.get(target)?.get(field) ?? 0)
      keyframes = keyframes.map((key) => ({ time: key.time, value: key.value + handAt(key.time) }))
    }
    out.push({ id: `${target}-${field}`, target, property: field, keyframes })
  }
  return out
}
