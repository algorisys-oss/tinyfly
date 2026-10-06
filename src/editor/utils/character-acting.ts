import type { Keyframe, Track } from '../../engine/types'
import { Timeline } from '../../engine/core/timeline'
import {
  actCharacterTracks,
  characterPoseTracks,
  gag,
  gaitPose,
  gaitStrideLength,
  lipSyncOver,
  mirrorHumanPose,
  mixPoses,
  pose as stickPose,
  stickToHuman,
  GAIT_CYCLE_MS,
  REST_POSE,
  type ActingStyleName,
  type CharacterPose,
  type CharacterPoseKey,
  type GagName,
  type GaitName,
  type SpokenLine,
} from '../../characters'
import { isCharacterField } from './character-element'
import type { PropertyKeyframes } from './character-dance'

/**
 * Acting for the editor's Character element.
 *
 * A character's motion is keyed poses. With acting on, the element keeps its
 * plain key poses (`CharacterActing.keys`) and its tracks are generated from
 * them by the acting pass, so keying another pose, adding a gag or saying a
 * line re-acts the whole performance instead of acting on top of acted
 * tracks. Turning acting off writes the plain poses back. Either way the
 * timeline holds ordinary keyframes, so it saves, exports and plays anywhere.
 *
 * Gags and gaits come from the stick figure, turned into character fields
 * with `stickToHuman` (as dances are).
 */

/** A key pose with the whole pose resolved (every field). */
export interface KeyPose extends CharacterPoseKey {
  pose: CharacterPose
}

/** What an acted character keeps: its plain key poses, the style, and its spoken lines. */
export interface CharacterActing {
  style: ActingStyleName
  keys: KeyPose[]
  lines?: SpokenLine[]
}

/** The character fields a set of tracks animates on `target`. */
const characterTracksOf = (tracks: ReadonlyArray<Track | { target: string; property: string }>, target: string) =>
  tracks.filter((track): track is Track => track.target === target && isCharacterField(track.property) && 'keyframes' in track)

/**
 * The key poses a character's tracks hold: one key at every time any of its
 * fields is keyed, with the whole pose there (fields not keyed at that time
 * take their animated value). `rest` is the element's own pose.
 */
export function keyPosesOf(tracks: ReadonlyArray<Track | { target: string; property: string }>, target: string, rest: CharacterPose): KeyPose[] {
  const own = characterTracksOf(tracks, target)
  const times = [...new Set(own.flatMap((track) => track.keyframes.map((key) => key.time)))].sort((a, b) => a - b)
  if (times.length === 0) return []
  const timeline = new Timeline({ id: 'keys', tracks: own })
  return times.map((time) => {
    const pose: CharacterPose = { ...rest }
    for (const [field, value] of timeline.getStateAtTime(time).values.get(target) ?? []) if (typeof value === 'number') pose[field] = value
    return { time, pose }
  })
}

/** Plain key poses as tracks (`none`), or acted, with the spoken lines lip-synced over the mouth. */
export function actingTracks(target: string, acting: CharacterActing, rest: CharacterPose): PropertyKeyframes[] {
  const keys = acting.keys
  if (keys.length === 0) return []
  const tracks = acting.style === 'none' ? characterPoseTracks(target, keys, rest) : actCharacterTracks(target, keys, { style: acting.style, rest })
  return lipSyncOver(target, tracks, acting.lines ?? [], { rest }).map((track) => ({ property: track.property, keyframes: track.keyframes as Keyframe[] }))
}

/**
 * Tracks to write for a target: `fresh`, plus an empty list for each
 * character field the target animates now but `fresh` leaves out (so it is
 * removed: a blink the acting added, gone when acting is off).
 */
export function withRemovals(existing: ReadonlyArray<Track | { target: string; property: string }>, target: string, fresh: PropertyKeyframes[]): PropertyKeyframes[] {
  const kept = new Set(fresh.map((track) => track.property))
  const stale = characterTracksOf(existing, target)
    .map((track) => track.property)
    .filter((property) => !kept.has(property))
  return [...fresh, ...[...new Set(stale)].map((property) => ({ property, keyframes: [] }))]
}

/** `added` keys put into `keys`: keys inside the span they cover are replaced, the rest kept, in time order. */
export function spliceKeys(keys: KeyPose[], added: KeyPose[]): KeyPose[] {
  if (added.length === 0) return keys
  const from = added[0].time
  const to = added[added.length - 1].time
  return [...keys.filter((key) => key.time < from || key.time > to), ...added].sort((a, b) => a.time - b.time)
}

/** A key pose upserted at `time`: replacing a key within a millisecond, else added. */
export function upsertKey(keys: KeyPose[], time: number, pose: CharacterPose): KeyPose[] {
  const others = keys.filter((key) => Math.abs(key.time - time) >= 1)
  return [...others, { time, pose }].sort((a, b) => a.time - b.time)
}

/**
 * The stick figure's change from `base`, laid over a character pose: the
 * fields a stick pose moves (as character fields) replace the character's,
 * the rest of the character (its view, outfit pose, hands) stays. Facing
 * left (`facing` -1), the change is mirrored.
 */
function overlayStick(current: CharacterPose, stick: ReturnType<typeof stickPose>, facing: number, base = REST_POSE): CharacterPose {
  let moved = stickToHuman(stick)
  let rest = stickToHuman(base)
  if (facing < 0) {
    moved = mirrorHumanPose(moved)
    rest = mirrorHumanPose(rest)
  }
  const out = { ...current }
  for (const [field, value] of Object.entries(moved)) {
    if (field === 'turn') continue
    if (Math.abs(value - (rest[field] ?? 0)) > 1e-6) out[field] = value
  }
  return out
}

export interface GagOptions {
  /** Playhead, ms */
  start: number
  /** The character's pose at the playhead */
  pose: CharacterPose
  /** -1 when it faces screen-left */
  facing?: number
}

/**
 * A gag as character key poses from `start`, built on the character's pose:
 * the gag's moves replace the fields they move. Its keys after the first are
 * marked `act: false`: a gag's timing is already acted.
 */
export function characterGagKeys(name: GagName, options: GagOptions): KeyPose[] {
  const facing = (options.facing ?? 1) < 0 ? -1 : 1
  // Act it in the character's view: side-on, a raised arm goes up, not toward the camera.
  const base = stickPose({ turn: stickTurnOf(options.pose.turn ?? 0) })
  return gag(name, { at: options.start, from: base }).map((key) => ({
    time: Math.round(key.time),
    pose: overlayStick(options.pose, key.pose as ReturnType<typeof stickPose>, facing, base),
    ...(key.act === false ? { act: false } : {}),
  }))
}

/**
 * How far a character view is from front-on, as the stick figure's `turn`
 * (0 front … 1 side): the character's 0–1 is front to side, 1–3 is side
 * through the back to the other side (the stick figure has no back view),
 * 3–4 the other side back to the front.
 */
export function stickTurnOf(turn: number): number {
  const quarter = ((turn % 4) + 4) % 4
  if (quarter <= 1) return quarter
  if (quarter >= 3) return 4 - quarter
  return 1
}

export interface WalkOptions {
  /** Playhead, ms */
  start: number
  /** How far, px: positive walks screen-right, negative screen-left */
  distance: number
  /** The character's height, px */
  height: number
  /** The character's pose at the playhead (the walk starts and ends in it, turned to walk) */
  pose: CharacterPose
  /** Its `x` offset at the playhead */
  x?: number
  /** Keys per gait cycle (default 8) */
  samplesPerCycle?: number
}

/** Easing in and out of a walk, ms. */
const WALK_RAMP = 250
/** v2 legs are a little shorter than the stick figure's (thigh + shin as fractions of the height). */
const LEG_RATIO = (0.215 + 0.205) / (0.24 + 0.22)

/**
 * A walk in a gait as character keys (`act: false`: a cycle is already
 * timed) and an `x` track, from `start`. The character turns side-on to the
 * way it walks, eases into the stride and out of it, and its feet stay
 * planted. Its face and hands keep the pose it starts in.
 */
export function characterWalk(gait: GaitName, options: WalkOptions): { keys: KeyPose[]; x: Keyframe[]; end: number } {
  const direction = options.distance < 0 ? -1 : 1
  const stride = gaitStrideLength(gait, options.height) * LEG_RATIO
  const cycles = Math.abs(options.distance) / stride
  const duration = Math.max(WALK_RAMP * 2, cycles * GAIT_CYCLE_MS[gait])
  const samples = Math.max(4, Math.ceil(cycles * (options.samplesPerCycle ?? 8)))
  const x0 = options.x ?? 0
  const side: CharacterPose = { ...options.pose, turn: direction > 0 ? 1 : 3 }
  const keys: KeyPose[] = []
  const x: Keyframe[] = []
  for (let i = 0; i <= samples; i++) {
    const along = i / samples
    const time = Math.round(options.start + along * duration)
    const elapsed = along * duration
    const weight = Math.min(1, elapsed / WALK_RAMP, (duration - elapsed) / WALK_RAMP)
    const walking = overlayStick(side, gaitPose(gait, along * cycles, stickPose({ turn: 1 })), direction, stickPose({ turn: 1 }))
    keys.push({ time, pose: mixPoses(side, walking, Math.max(0, weight)), ...(i > 0 ? { act: false } : {}) })
    // Linear between samples: a steady pace keeps the planted foot still.
    x.push({ time, value: x0 + direction * Math.abs(options.distance) * along, easing: 'linear' })
  }
  return { keys, x, end: options.start + duration }
}
